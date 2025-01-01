//
import { NextFunction, Request, Response } from "express";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import { courseModel } from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse } from "../../services/course.service";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import cloudinary from "cloudinary";
import { notificationModel } from "../models/notification.model";


export const uploadCourse = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "course",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "course",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const courseId = req.params.id;
      const course = await courseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course --- without purchasing
export const getSingleCourse = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await courseModel
          .findById(courseId)
          .select(
            "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
          );

        await redis.set(courseId, JSON.stringify(course));

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get All course --- without purchasing
export const getCourse = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourse");

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await courseModel
          .find()
          .select(
            "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
          );

        await redis.set("allCourse", JSON.stringify(course));

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content --- only valid user
export const getCourseByUser = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExist = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 400)
        );
      }

      const course = await courseModel.findById(courseId);

      const courseContent = course?.courseData;

      res.status(200).json({
        success: true,
        courseContent,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await courseModel.findById(courseId);

      if (mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }

      const courseContent = course?.courseData.find((value: any) =>
        value._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this question to our courseContent
      courseContent.questions.push(newQuestion);

      await notificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `${req.user?.name} has asked a question in ${courseContent.title} At this course ${course?.name}`,
      })

      // save the updated course
      await course?.save();

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in course content

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await courseModel.findById(courseId);

      if (mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id ", 400));
      }

      const courseContent = course?.courseData.find((value: any) =>
        value._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent.questions.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      question.questionReplies?.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user?._id) {
        // TODO: create a notification
        await notificationModel.create({
          user: req.user?._id,
          title: "New Answer Received",
          message: `${req.user?.name} has answered a question in ${courseContent.title} At this course ${course?.name}`,
        })

      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course

interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      // if course id already exist in the userCourseList based on _id
      const courseExist = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course  ", 404)
        );
      }

      const course = await courseModel.findById(courseId);

      const { review, rating }: IAddReviewData = req.body;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.rating = avg / course.reviews.length; // on example we have 2 review one is 5 and 2 is 4 avg is 9 divide by length gives 9/ 2 -> 4.5 ratings
      }

      await course?.save();

      const notification = {
        title: "New Review Received",
        message: `${req.user?.name} has given a review in  ${course?.name}`,
      };

      // create notification

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply to review

interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;

      const course = await courseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course.reviews.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// get All courses
export const getAllCourses = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await courseModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete course -- by admin
export const deleteCourse = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const course = await courseModel.findById(courseId);

      if(!course){
        return next(new ErrorHandler("Course not found", 404));
      }

      await course.deleteOne({courseId});
      
      await redis.del(courseId);

      res.status(200).json({
        success: true,
        message : "Course deleted successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

