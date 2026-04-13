import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../controllers/userController.js";

const router = Router();

router.post("/", createUser);
router.get("/", listUsers);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
