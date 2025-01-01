import { Router } from "express";
import { authorizedRole, isAuthenticated } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";

const router = Router();


router.get("/get-all-notification",isAuthenticated,authorizedRole("admin"),getNotifications);

router.get("/update-notification/:id",isAuthenticated,authorizedRole("admin"),updateNotification);


export default router