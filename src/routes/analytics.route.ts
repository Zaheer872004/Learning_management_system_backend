import { Router } from "express";
import { getUserAnalytics } from "../controllers/analytics.controller";
import { authorizedRole, isAuthenticated } from "../middleware/auth";

const router = Router();


router.get("/get-user-analytics",isAuthenticated,authorizedRole("admin"), getUserAnalytics);


export default router;