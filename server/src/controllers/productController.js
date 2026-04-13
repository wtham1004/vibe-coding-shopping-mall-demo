import mongoose from "mongoose";
import { Product } from "../models/Product.js";

const DUPLICATE_SKU_ERROR =
  "이미 사용 중인 SKU입니다. 다른 SKU를 입력해 주세요.";

function isDuplicateKeyError(err) {
  return err.code === 11000 || err.code === 11001;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parsePrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

export async function createProduct(req, res) {
  try {
    const { sku, name, price, category, image, description } = req.body ?? {};
    if (!sku || !name || price === undefined || price === null || !category || !image) {
      return res.status(400).json({
        error: "sku, name, price, category, image는 필수입니다.",
      });
    }
    const priceNum = parsePrice(price);
    if (priceNum === null) {
      return res.status(400).json({ error: "올바른 가격을 입력해 주세요." });
    }
    const product = await Product.create({
      sku: String(sku).trim(),
      name: String(name).trim(),
      price: priceNum,
      category: String(category).trim(),
      image: String(image).trim(),
      description:
        description === undefined || description === null
          ? undefined
          : String(description).trim(),
    });
    return res.status(201).json(product.toObject());
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: DUPLICATE_SKU_ERROR });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/products — MongoDB 전체 상품 (최신순). 스토어·어드민 공통 조회. */
export async function listProducts(_req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid product id" });
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid product id" });
    }
    const { sku, name, price, category, image, description } = req.body ?? {};
    const update = {};

    if (sku !== undefined) {
      const trimmed = String(sku).trim();
      const conflict = await Product.findOne({ sku: trimmed }).select("_id").lean();
      if (conflict && conflict._id.toString() !== id) {
        return res.status(409).json({ error: DUPLICATE_SKU_ERROR });
      }
      update.sku = trimmed;
    }
    if (name !== undefined) update.name = String(name).trim();
    if (category !== undefined) update.category = String(category).trim();
    if (image !== undefined) update.image = String(image).trim();
    if (price !== undefined) {
      const priceNum = parsePrice(price);
      if (priceNum === null) {
        return res.status(400).json({ error: "올바른 가격을 입력해 주세요." });
      }
      update.price = priceNum;
    }
    if (description !== undefined) {
      update.description =
        description === null ? "" : String(description).trim();
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "no fields to update" });
    }

    const product = await Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }
    return res.json(product);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: DUPLICATE_SKU_ERROR });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid product id" });
    }
    const deleted = await Product.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: "product not found" });
    }
    return res.json({ deleted: true, product: deleted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
