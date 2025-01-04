import { NextFunction, Request, Response } from "express";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthSData } from "../utils/analytics.generator";
import { userModel } from "../models/user.model";

// get user analytics --only for admin
export const getUserAnalytics = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const user = await generateLast12MonthSData(userModel);

      res.status(200).json({
        success: true,
        user,
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
