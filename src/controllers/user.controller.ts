import { Request, Response, NextFunction } from "express";
import { userModel, IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import { createActivationToken } from "../utils/activationToken";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { access, cp } from "fs";
import { redis } from "../utils/redis";
import Redis, { RedisKey } from "ioredis";
import { getUserById } from "../../services/user.service";
// import cloudinary from "cloudinary"


// register our user
interface IRegister {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password }: IRegister = req.body;

      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandler("Email is already exist", 400));
      }

      const user: IRegister = {
        name,
        email,
        password,
      };

      // Creating the activation token
      // const activationToken =  createActivationToken(user);

      // const { activationCode } = activationToken;

      const { activationCode, token } = createActivationToken(user);

      const data = { user: { name: user.name }, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendEmail({
          email: user.email,
          subject: "Account Activation",
          template: "activation-mail.ejs",
          data: data,
        });

        console.log(activationCode);
        res.status(200).json({
          success: true,
          message: `Account activation email has been sent to your email ${user.email} `,
          activationToken: token,
          activationCode,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// activate user account
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      // generally we get the activation_token from cookies or header not body

      if (!activation_token || !activation_code) {
        return next(
          new ErrorHandler("Activation token and code are required", 400)
        );
      }

      // Verify the activation token
      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("User already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: `User Activated Successfully `,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface ILoginUser {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginUser;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(
          new ErrorHandler("User not found, please register first", 400)
        );
      }

      const isPasswordCorrect = await user.comparePassword(password);

      if (!isPasswordCorrect) {
        return next(new ErrorHandler("Email & Password is incorrect", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userId = req.user?._id;
      await redis.del(userId as RedisKey);

      res.status(200).json({
        success: true,
        message: "User LoggedOut Successfully",
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update accessToken
export const updateAccessToken = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;

      if (!refresh_token) {
      }

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload;

      const msg = "Could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(msg, 400));
      }

      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(new ErrorHandler(msg, 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as string) || "",
        }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
          expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as string) || "",
        }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get user info
export const getUserInfo = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// social auth
interface ISocialAuth {
  email: string;
  name: string;
  avatar: string;
}
// not understand now will do it after words
export const socialAuth = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuth;

      const user = await userModel.findOne({ email });

      if (!user) {
        const newUser = await userModel.create({
          email,
          name,
          avatar,
        });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update use info
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;

      const user = await userModel.findById(userId);

      if (email && user) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email Already exists", 400));
        }
        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId as RedisKey, JSON.stringify(user) as any);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user password
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const updateUserPassword = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword, confirmPassword } =
        req.body as IUpdateUserPassword;
      const userId = req.user?._id;

      if (!oldPassword || !newPassword || !newPassword) {
        return next(
          new ErrorHandler("Please Provide the Full Credentials", 400)
        );
      }

      if (newPassword !== confirmPassword) {
        return next(
          new ErrorHandler("Your newPassword newPassword are not match", 400)
        );
      }

      const user = await userModel.findById(userId).select("+password");
      if (user?.password == undefined) {
        return next(new ErrorHandler("Invalid User", 400));
      }

      const isPasswordCorrect = await user?.comparePassword(oldPassword);

      if (!isPasswordCorrect) {
        return next(
          new ErrorHandler("Please enter the old Password correctly ", 400)
        );
      }

      user.password = newPassword;
      await user.save();

      await redis.set(userId as RedisKey, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update profile picture | Avatar
interface IUpdateUserAvatar {
  avatar: string;
}

export const updateProfilePicture = CatchAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateUserAvatar
      const userId = req.user?._id
      const user = await userModel.findById(userId);

      // if user have avatar then call this
      if(avatar && user){
        if(user?.avatar?.public_id){
          // if have avatar already first delete it then upload other
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)
        
          const myCloud = await cloudinary.v2.uploader.upload(avatar,{
            folders:"avatars",
            width:150
          });
          user.avatar = {
            public_id : myCloud.public_id,
            url : myCloud.secure_url,
          }
        
        }
        else{
          // if not have avatar then upload it 
          const myCloud = await cloudinary.v2.uploader.upload(avatar,{
            folders:"avatars",
            width:150
          });
          user.avatar = {
            public_id : myCloud.public_id,
            url : myCloud.secure_url,
          }
        }
      }

      await user?.save();

      await redis.set(userId as RedisKey, JSON.stringify(user));
      
      res.status(201).json({
        success: true,
        user,
      })

    } catch (error:any) {
      return next(new ErrorHandler(error.message,400))
    }
  }
);
