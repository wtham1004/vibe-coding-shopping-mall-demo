import mongoose from "mongoose";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { EMAIL_REGEX, normalizeEmail } from "../utils/validation.js";

/** 이메일 기준으로 이미 가입된 사용자가 있을 때 (스키마 unique와 동일 기준) */
const DUPLICATE_USER_ERROR = "이미 등록된 이메일입니다. 다른 이메일을 사용해 주세요.";

function isDuplicateKeyError(err) {
  return err.code === 11000 || err.code === 11001;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function createUser(req, res) {
  try {
    const { email, name, password, user_type, address } = req.body ?? {};
    if (!email || !name || !password) {
      return res.status(400).json({
        error: "email, name, and password are required",
      });
    }
    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
    }
    const emailNorm = normalizeEmail(email);
    const alreadyExists = await User.exists({ email: emailNorm });
    if (alreadyExists) {
      return res.status(409).json({ error: DUPLICATE_USER_ERROR });
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: emailNorm,
      name,
      password: passwordHash,
      user_type: user_type ?? "customer",
      address,
    });
    const safe = await User.findById(user._id).select("-password").lean();
    return res.status(201).json(safe);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: DUPLICATE_USER_ERROR });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function listUsers(_req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid user id" });
    }
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid user id" });
    }
    const { email, name, password, user_type, address } = req.body ?? {};
    const update = {};
    if (email !== undefined) {
      if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
      }
      const emailNorm = normalizeEmail(email);
      const conflict = await User.findOne({ email: emailNorm }).select("_id").lean();
      if (conflict && conflict._id.toString() !== id) {
        return res.status(409).json({ error: DUPLICATE_USER_ERROR });
      }
      update.email = emailNorm;
    }
    if (name !== undefined) update.name = name;
    if (user_type !== undefined) update.user_type = user_type;
    if (address !== undefined) update.address = address;
    if (password !== undefined) {
      update.password = await hashPassword(password);
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "no fields to update" });
    }
    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json(user);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: DUPLICATE_USER_ERROR });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid user id" });
    }
    const deleted = await User.findByIdAndDelete(id).select("-password").lean();
    if (!deleted) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json({ deleted: true, user: deleted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
