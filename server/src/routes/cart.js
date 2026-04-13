import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  addCartItem,
  deleteCart,
  getCart,
  removeCartItem,
  replaceCart,
  updateCartItem,
} from "../controllers/cartController.js";

const router = Router();

router.use(authenticate);

/** 장바구니 조회 (없으면 빈 카트 생성) */
router.get("/", getCart);

/** 장바구니 전체 줄 항목 교체 */
router.put("/", replaceCart);

/** 장바구니 문서 삭제 */
router.delete("/", deleteCart);

/** 줄 항목 추가 (동일 상품·size·color면 수량 합산) */
router.post("/items", addCartItem);

/** 줄 항목 수정 */
router.patch("/items/:itemId", updateCartItem);

/** 줄 항목 삭제 */
router.delete("/items/:itemId", removeCartItem);

export default router;
