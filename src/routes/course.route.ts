import { Router } from "express";
import { addAnswer, addQuestion, addReview, editCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
import { authorizedRole, isAuthenticated } from "../middleware/auth";

const router = Router();

router.post(
  "/create-course",
  isAuthenticated,
  authorizedRole("admin"),
  uploadCourse
);


router.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizedRole("admin"),
  editCourse
);

// get single course --- without purchasing
router.get(
  "/get-course/:id",
  getSingleCourse
);

// get All course --- without purchasing
router.get(
  "/get-all-course",
  getAllCourses
);


// get course content --- only valid user
router.get(
  "/get-course-content/:id",
  isAuthenticated,
  getCourseByUser
);

router.put(
  "/add-question",
  isAuthenticated,
  addQuestion
);


router.put(
  "/add-answer",
  isAuthenticated,
  addAnswer
);


router.put(
  "/add-review/:id",
  isAuthenticated,
  addReview
);

router.put(
  "/add-reply",
  isAuthenticated,
  authorizedRole("admin"),
  addReview
);

export default router;
