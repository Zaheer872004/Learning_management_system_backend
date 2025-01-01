import { NextFunction, Request, Response } from "express";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { notificationModel } from "../models/notification.model";
import cron from "node-cron";

// get All notification -- only for the admin
export const getNotifications = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await notificationModel
        .find()
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update notification status --only for admin
export const updateNotification = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await notificationModel.findById(req.params.id);

      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      notification.status = "read";
      await notification.save();

      const notifications = await notificationModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// cron.schedule("*/5 * * * *", async () => {
  //   try {
    //     await notificationModel.deleteMany({
      //       status: "read",
      //     });
      //   } catch (error: any) {
        //     console.log(error);
        //   }
        // })


// delete notification -- only for admin
cron.schedule("0 0 0 * * *", async ()=>{
  
  const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000);

  const fivteenDaysAgo = new Date(Date.now()-15*24*60*60*1000);

  await notificationModel.deleteMany({
    status : "read",
    createdAt : {$lt : fivteenDaysAgo}
  })
})