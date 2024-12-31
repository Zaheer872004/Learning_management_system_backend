import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncHandler } from "./catchAsyncError";
import jwt, { JwtPayload } from "jsonwebtoken"
import { redis } from "../utils/redis";

// authenticated  user
export const isAuthenticated = CatchAsyncHandler( async (req:Request,res:Response,next:NextFunction) => {

  const access_token = req.cookies.access_token

  if(!access_token) {
    return next(new ErrorHandler("Please logging to access this resource",400))

  }

  const decoded = jwt.verify(access_token,process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload

  if(!decoded){
    return next( new ErrorHandler("access token is not valid",400))
  }

  const user = await redis.get(decoded.id)

  if(!user){
    return next( new ErrorHandler("User not found",400))
  }

  req.user = JSON.parse(user)
  next()  
})

// validate user role
export const authorizedRole = (...roles: string[]) => {

  //  [admin].include(req.user?.role)
  return (req:Request, res:Response, next: NextFunction) => {
    if(!roles.includes(req.user?.role || "")){
      return next(new ErrorHandler(`Roles: ${req.user?.role} is not allowed to access this resource`,403))
    }
    next()
  }

}
