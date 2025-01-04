import { Router } from "express";
import { authorizedRole, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrder } from "../controllers/order.controller";

const router = Router()


router.post('/create-order',isAuthenticated,createOrder)

router.get('/get-all-order',isAuthenticated,authorizedRole("admin"),getAllOrder)


export default router