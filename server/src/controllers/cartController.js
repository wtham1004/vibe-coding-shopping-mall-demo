import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

function userIdFromAuth(req) {
  const sub = req.auth?.sub;
  if (!sub || !mongoose.Types.ObjectId.isValid(sub)) {
    return null;
  }
  return new mongoose.Types.ObjectId(sub);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.product",
      select: "sku name price category image description",
    })
    .lean();
  if (!cart) {
    const created = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(created._id)
      .populate({
        path: "items.product",
        select: "sku name price category image description",
      })
      .lean();
  }
  return cart;
}

/** GET /api/cart */
export async function getCart(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const cart = await getOrCreateCart(userId);
    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** PUT /api/cart — 전체 줄 항목 교체 */
export async function replaceCart(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { items } = req.body ?? {};
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items 배열이 필요합니다." });
    }

    const normalized = [];
    for (const row of items) {
      const productId = row?.product ?? row?.productId;
      if (!productId || !isValidObjectId(String(productId))) {
        return res.status(400).json({ error: "각 항목에 유효한 product가 필요합니다." });
      }
      const q = Number(row?.quantity);
      if (!Number.isFinite(q) || q < 1) {
        return res.status(400).json({ error: "quantity는 1 이상의 숫자여야 합니다." });
      }
      const exists = await Product.exists({ _id: productId });
      if (!exists) {
        return res.status(400).json({ error: `상품을 찾을 수 없습니다: ${productId}` });
      }
      normalized.push({
        product: productId,
        quantity: Math.floor(q),
        size:
          row.size === undefined || row.size === null
            ? undefined
            : String(row.size).trim(),
        color:
          row.color === undefined || row.color === null
            ? undefined
            : String(row.color).trim(),
      });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: normalized }, $setOnInsert: { user: userId } },
      { new: true, upsert: true, runValidators: true },
    )
      .populate({
        path: "items.product",
        select: "sku name price category image description",
      })
      .lean();

    return res.json(cart);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/cart — 장바구니 문서 삭제 (다음 요청 시 빈 카트 재생성) */
export async function deleteCart(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const result = await Cart.deleteOne({ user: userId });
    return res.json({ deleted: result.deletedCount > 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** POST /api/cart/items */
export async function addCartItem(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { product: productId, productId: altId, quantity, size, color } =
      req.body ?? {};
    const pid = productId ?? altId;
    if (!pid || !isValidObjectId(String(pid))) {
      return res.status(400).json({ error: "유효한 product id가 필요합니다." });
    }
    const exists = await Product.exists({ _id: pid });
    if (!exists) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }
    const q = quantity === undefined || quantity === null ? 1 : Number(quantity);
    if (!Number.isFinite(q) || q < 1) {
      return res.status(400).json({ error: "quantity는 1 이상이어야 합니다." });
    }
    const sizeStr =
      size === undefined || size === null ? "" : String(size).trim();
    const colorStr =
      color === undefined || color === null ? "" : String(color).trim();

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const match = cart.items.find(
      (it) =>
        it.product.toString() === String(pid) &&
        (it.size ?? "") === sizeStr &&
        (it.color ?? "") === colorStr,
    );
    if (match) {
      match.quantity += Math.floor(q);
    } else {
      cart.items.push({
        product: pid,
        quantity: Math.floor(q),
        size: sizeStr || undefined,
        color: colorStr || undefined,
      });
    }
    await cart.save();

    const fresh = await Cart.findById(cart._id)
      .populate({
        path: "items.product",
        select: "sku name price category image description",
      })
      .lean();
    return res.status(201).json(fresh);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/cart/items/:itemId */
export async function updateCartItem(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { itemId } = req.params;
    if (!itemId || !isValidObjectId(itemId)) {
      return res.status(400).json({ error: "유효한 item id가 필요합니다." });
    }
    const { quantity, size, color } = req.body ?? {};

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "장바구니를 찾을 수 없습니다." });
    }
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: "해당 장바구니 항목을 찾을 수 없습니다." });
    }

    if (quantity !== undefined) {
      const q = Number(quantity);
      if (!Number.isFinite(q) || q < 1) {
        return res.status(400).json({ error: "quantity는 1 이상이어야 합니다." });
      }
      item.quantity = Math.floor(q);
    }
    if (size !== undefined) {
      item.size = size === null ? undefined : String(size).trim() || undefined;
    }
    if (color !== undefined) {
      item.color = color === null ? undefined : String(color).trim() || undefined;
    }

    await cart.save();
    const fresh = await Cart.findById(cart._id)
      .populate({
        path: "items.product",
        select: "sku name price category image description",
      })
      .lean();
    return res.json(fresh);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/cart/items/:itemId */
export async function removeCartItem(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { itemId } = req.params;
    if (!itemId || !isValidObjectId(itemId)) {
      return res.status(400).json({ error: "유효한 item id가 필요합니다." });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "장바구니를 찾을 수 없습니다." });
    }
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: "해당 장바구니 항목을 찾을 수 없습니다." });
    }
    cart.items.pull({ _id: itemId });
    await cart.save();

    const fresh = await Cart.findById(cart._id)
      .populate({
        path: "items.product",
        select: "sku name price category image description",
      })
      .lean();
    return res.json(fresh);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
