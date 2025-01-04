import { Router } from "express";
import { authorizedRole, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";


const router = Router();

router.post("/create-layout",isAuthenticated,authorizedRole("admin"),createLayout);

router.put("/edit-layout",isAuthenticated,authorizedRole("admin"),editLayout);

router.get("/get-layout",getLayoutByType);



export default router;

