//
/*--------------------------------------------------*
 *                                                  *
 *   File is Creating token and otp for the  user   *
 *                                                  *
 *--------------------------------------------------*/

import { IUser } from "../models/user.model";
import jwt from "jsonwebtoken";

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    { activationCode, user },
    process.env.ACTIVATION_SECRET as string,
    { expiresIn: "10m" }
  );

  return { token, activationCode };
};

// console.log(process.env.ACTIVATION_SECRET)
