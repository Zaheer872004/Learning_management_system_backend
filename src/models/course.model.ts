import mongoose, { Document, Schema, Model } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies?: IComment[];
}

interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

export interface ILink extends Document {
  title: string;
  url: string;
}

export interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}

export interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  rating?: number;
  purchased?: number;
}

export const reviewSchema: Schema<IReview> = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
  },
  commentReplies: [Object],
});

export const linkSchema: Schema<ILink> = new Schema<ILink>({
  title: String,
  url: String,
});

export const commentSchema: Schema<IComment> = new Schema<IComment>({
  user: Object,
  question: String,
  questionReplies: [Object],
});

export const courseDataSchema: Schema<ICourseData> = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  // videoThumbnail: Object,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});

const courseSchema: Schema<ICourse> = new mongoose.Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  estimatedPrice: Number,
  thumbnail: {
    public_id: {
      type: String,
      // require: true,
    },
    url: {
      type: String,
      // require: true,
    },
  },
  tags: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  demoUrl: {
    type: String,
    required: true,
  },
  benefits: [{ title: String }],
  prerequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  rating: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
});

export const courseModel: Model<ICourse> = mongoose.model<ICourse>(
  "Course",
  courseSchema
);
