import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
require("dotenv").config();
import ErrorMiddleware from "./middleware/error";

const app = express();

//body parser
app.use(express.json({ limit: "50mb" }));

//cors - cross origin resource sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// cookieParser
app.use(cookieParser());

// routes

import userRoutes from "./routes/user.route";
import courseRoutes from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/analytics", analyticsRouter);

// testing api
// app.get('/', (req:Request, res:Response) => {
//   res.status(200).send('API is running')
// })

app.use(ErrorMiddleware);

// Configure Cloudinary
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.cloud_name,
  api_secret: process.env.api_secret,
});

export { app };
