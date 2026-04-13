import mongoose from "mongoose";
import { hashPassword, isBcryptHash } from "../utils/password.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    user_type: {
      type: String,
      required: true,
      enum: ["customer", "admin"],
      default: "customer",
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPasswordOnSave() {
  if (!this.isModified("password")) return;
  if (isBcryptHash(this.password)) return;
  this.password = await hashPassword(this.password);
});

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
