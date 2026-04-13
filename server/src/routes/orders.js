import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrder,
} from "../controllers/orderController.js";

const router = Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
