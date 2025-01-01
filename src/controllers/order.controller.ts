import { NextFunction, Request, Response } from "express";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { orderModel, IOrder } from "../models/order.model";
import { userModel } from "../models/user.model";
import { courseModel, ICourse } from "../models/course.model";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { notificationModel } from "../models/notification.model";

export const createOrder = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, userId, payment_info } = req.body as IOrder;

      const user = await userModel.findById(req.user?._id);

      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const course = await courseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      if (course._id) {
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      // const id: string = course._id as string;
      let mailData;
      if (course._id) {
        mailData = {
          order: {
            _id: course._id.toString().slice(0, 6),
            name: course.name,
            price: course.price,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        } as any;
      }

      const html = await ejs.renderFile(
        __dirname + "../mails/order-confirmation.ejs",
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler("Error sending mail", 500));
      }

      const newId = course._id as string;
      user?.courses.push({ courseId: newId });

      await user?.save();

      const notification = await notificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have new order from ${course?.name}`,
      });

      // if (course.purchased) {
      //   course.purchased += 1;
      // }
      course.purchased ? (course.purchased += 1) : course.purchased;

      await course.save();

      const order = await orderModel.create(data);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get All order
export const getAllOrder = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
