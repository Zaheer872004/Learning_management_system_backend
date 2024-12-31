//
/*--------------------------------------------------*
    *                                               *
    *  File is about sending the token to the user  *
    *                                               *
    *-----------------------------------------------*/

// require("dotenv").config();

import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
import { RedisKey } from "ioredis";

interface tokenOptions {
  expired: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// parse the environment variable to integrates with  fallback values

const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRY || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRY || "1200",
  10
);

// options for cookies
export const accessTokenOptions: tokenOptions = {
  expired: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: tokenOptions = {
  expired: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // const userId = user?._id as string

  //  upload session to the redis
  redis.set(user._id as RedisKey, JSON.stringify(user) as any);

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
