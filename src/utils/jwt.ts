import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
import { RedisKey } from "ioredis";

interface tokenOptions {
  expires: Date; // corrected field name from `expired` to `expires`
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Parse environment variables with fallback
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRY || "300", 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRY || "1200", 10);

// Cookie options
export const accessTokenOptions: tokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 1000), // Convert to milliseconds
  maxAge: accessTokenExpire * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: tokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = async (user: IUser, statusCode: number, res: Response) => {
  // Await the token generation since it’s async
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  // Store session in Redis
  await redis.set(user._id as RedisKey, JSON.stringify(user));

  // Set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  // Set cookies
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  // Respond with JSON
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
