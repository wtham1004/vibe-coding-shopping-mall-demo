import mongoose from "mongoose";

/** 주문 상태 — 결제·배송 흐름 */
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipping_started",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "US" },
  },
  { _id: false },
);

const paymentSummarySchema = new mongoose.Schema(
  {
    method: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    providerPaymentId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    amount: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "pending_payment",
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "USD",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(arr) => Array.isArray(arr) && arr.length > 0, "items required"],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    billingAddress: {
      type: shippingAddressSchema,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    payment: {
      type: paymentSummarySchema,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    carrier: {
      type: String,
      trim: true,
    },
    shippedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
