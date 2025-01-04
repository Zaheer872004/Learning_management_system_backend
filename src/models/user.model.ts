import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      maxLength: [30, "Your name cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      // match: [emailRegexPattern, "Please enter a valid email address"],
      validate: {
        validator: function (value: string): boolean {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      // required: [true, "Please enter your password"],
      minlength: [6, "Your password must be longer than 6 characters"],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        // required: true
      },
      url: {
        type: String,
        // required: true
      },
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: {
          // type: Schema.Types.ObjectId,
          // ref: "Course"
          // courseId: String,
          type : String
        },
      },
    ],
  },
  { timestamps: true }
);

// Encrypting password before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword: string) : Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    { id: this._id }, 
    process.env.ACCESS_TOKEN_SECRET as string || "", 
    {  expiresIn: "5m",}
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET as string || "",
    { expiresIn: "3d"}
  );
};

export const userModel = mongoose.model<IUser>("User", userSchema);
