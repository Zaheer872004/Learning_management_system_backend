import { NextFunction, Response } from "express";
import { courseModel } from "../src/models/course.model";
import { CatchAsyncHandler } from "../src/middleware/catchAsyncError";
import ErrorHandler from "../src/utils/ErrorHandler";

// create course
export const createCourse = CatchAsyncHandler(
  async (data: any, res: Response) => {
    const course = await courseModel.create(data);
    res.status(201).json({
      success: true,
      course,
    });
  }
);


