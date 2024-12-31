import { Response } from "express";
import { userModel } from "../src/models/user.model";
import { redis } from "../src/utils/redis";

// get user by Id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);

    res.status(200).json({
      success: true,
      user,
    });
  }
};
