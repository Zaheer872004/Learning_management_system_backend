import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID error
  if (err.name === "CastError") {
    err = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
  }

  // mongo Duplicate key error
  if (err.code === 11000) {
    err = new ErrorHandler(
      `Duplicate ${Object.keys(err.keyValue)} entered`,
      400
    );
  }

  // Invalid JWT error
  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("JSON Web Token is invalid. Try again!", 400);
  }

  // Expired JWT error
  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("JSON Web Token is expired. Try again!", 400);
  }

  // Respond with error details
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default ErrorMiddleware;
