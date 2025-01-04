import mongoose, { Schema,Document,Model } from "mongoose";

interface FaqItem extends Document {
  question: string;
  answer: string;
}

interface Category extends Document {
  title: string;
}

interface BannerImage extends Document {
  public_id:string;
  url:string;
}

interface Layout extends Document {
  type : string;
  faq : FaqItem[];
  categories : Category[];
  bannerImages : {
    image : BannerImage;
    title : string;
    subtitle : string;
  };
}

const faqSchema = new Schema<FaqItem>({

  question: {
    type: String,
  },
  answer : {
    type: String,
  }

});

const categorySchema = new Schema<Category>({
  title: {
    type: String,
  }
});

const bannerImageSchema = new Schema<BannerImage>({
  public_id : {
    type : String
  },
  url : {
    type : String
  }
});
  
const layoutModel = new Schema<Layout>({
  type: {
    type: String,
    required: true,
  },
  faq: [faqSchema],
  categories: [categorySchema],
  bannerImages: {
    image : bannerImageSchema,
    title : {
      type : String
    },
    subtitle : {
      type : String
    }
  }
});

export const layoutSchema = mongoose.model<Layout>("Layout", layoutModel); 