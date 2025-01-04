import { NextFunction, Request, Response } from "express";
import { CatchAsyncHandler } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { layoutSchema } from "../models/layout.model";
import cloudinary from "cloudinary";

// create layout
export const createLayout = CatchAsyncHandler(async (req:Request, res:Response, next:NextFunction) => {
  // create layout
  try {
      const { type } = req.body;
      if(type === "Banner"){
        const {image,title,subtitle} = req.body

        // upload image on cloudinary
        const myCloud = await cloudinary.v2.uploader.upload(image,{
          folder: "layout"
        })

        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subtitle
        }

        // create banner layout
        await layoutSchema.create(banner);
      }

      if(type === "FAQ"){
        const {faq} = req.body

        const data = await Promise.all(faq.map(async (item:any) => {
          return {
            question:item.question,
            answer:item.answer
          }
        }))

        // create faq layout
        await layoutSchema.create({type : "FAQ", faq:data});
      }

      if(type === "Categories"){
        const {categories} = req.body

        const data = await Promise.all(categories.map(async (item:any) => {
          return {
            title : item.title,
          }
        })
      )

      await layoutSchema.create({type : "Categories", categories:data});


      }

      res.status(201).json({
        success: true,
        message: "Layout created successfully",
      })
    
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 500));
  }
});


// edit layout
export const editLayout = CatchAsyncHandler(async (req:Request, res:Response, next:NextFunction) => {
  // create layout
  try {
      const { type } = req.body;


      if(type === "Banner"){

        const bannerData:any = await layoutSchema.findOne({type:"Banner"});
      


        const {image,title,subtitle} = req.body

        if(bannerData){
          // delete image on cloudinary
          await cloudinary.v2.uploader.destroy(bannerData?.image.public_id);
        }

        // upload image on cloudinary
        const myCloud = await cloudinary.v2.uploader.upload(image,{
          folder: "layout"
        })

        const banner = {
          type : "Banner",
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subtitle
        }

        // create banner layout
        await layoutSchema.findByIdAndUpdate(bannerData._id,{banner});
      }

      if(type === "FAQ"){
        const {faq} = req.body

        const faqItem:any = await layoutSchema.findOne({type:"FAQ"});

        const data = await Promise.all(faq.map(async (item:any) => {
          return {
            question:item.question,
            answer:item.answer
          }
        }))

        // create faq layout
        await layoutSchema.findByIdAndUpdate(faqItem._id,{faq:data});
      }

      if(type === "Categories"){
        const {categories} = req.body

        const categoriesItem:any = await layoutSchema.findOne({type:"Categories"});


        const data = await Promise.all(categories.map(async (item:any) => {
          return {
            title : item.title,
          }
        })
      )

      await layoutSchema.findByIdAndUpdate(categoriesItem._id,{categories:data});

      }

      res.status(201).json({
        success: true,
        message: "Layout created successfully",
      })
    
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 500));
  }
});



// get layout by type
export const getLayoutByType = CatchAsyncHandler(async (req:Request, res:Response, next:NextFunction) => {
  // create layout
  try {
      
    const layout = await layoutSchema.findOne(req.body.type);

    res.status(200).json({
      success: true,
      layout,
    })

  } catch (error:any) {
    return next(new ErrorHandler(error.message, 500));
  }
})
