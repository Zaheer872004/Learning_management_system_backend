import { Response } from "express";
import { userModel } from "../src/models/user.model";
import { redis } from "../src/utils/redis";
import { addAbortListener } from "events";

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

// get All users
export const getAllUsersService = async (res: Response) => {
  const users = await userModel.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
};


export const updateUserRoleService = async (res: Response,id:string,role:string) => {

  const user = await userModel.findByIdAndUpdate(
    id,
    {
      role:role
    },
    {
      new : true,
    }
  );

  res.status(200).json({
    success: true,
    user,
  });
};
