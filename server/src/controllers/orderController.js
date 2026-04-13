import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order, ORDER_STATUSES } from "../models/Order.js";
import { User } from "../models/User.js";

function orderItemsFingerprint(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map((it) => ({
      sku: String(it?.sku ?? ""),
      qty: Number(it?.quantity ?? 0),
      size: it?.size == null ? "" : String(it.size),
      color: it?.color == null ? "" : String(it.color),
      unitPrice: Number(it?.unitPrice ?? 0),
    }))
    .sort((a, b) =>
      `${a.sku}|${a.size}|${a.color}`.localeCompare(`${b.sku}|${b.size}|${b.color}`),
    )
    .map((x) => `${x.sku}:${x.qty}:${x.size}:${x.color}:${x.unitPrice}`)
    .join(",");
}

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

function isAdmin(req) {
  return req.auth?.user_type === "admin";
}

async function generateUniqueOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderNumber = `NOIR-${y}${m}${d}-${rand}`;
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  return `NOIR-${Date.now()}-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
}

function parseMoney(n, fallback = 0) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return null;
  return x;
}

function normalizeShippingAddress(raw, label) {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${label} 객체가 필요합니다.`);
  }
  const recipientName = String(raw.recipientName ?? "").trim();
  const line1 = String(raw.line1 ?? "").trim();
  const city = String(raw.city ?? "").trim();
  const postalCode = String(raw.postalCode ?? "").trim();
  if (!recipientName || !line1 || !city || !postalCode) {
    throw new Error(
      `${label}: recipientName, line1, city, postalCode는 필수입니다.`,
    );
  }
  return {
    recipientName,
    phone: raw.phone === undefined ? undefined : String(raw.phone).trim(),
    line1,
    line2: raw.line2 === undefined ? undefined : String(raw.line2).trim(),
    city,
    state: raw.state === undefined ? undefined : String(raw.state).trim(),
    postalCode,
    country:
      raw.country === undefined || raw.country === null || raw.country === ""
        ? "US"
        : String(raw.country).trim(),
  };
}

async function assertOrderAccess(order, userId, req) {
  if (isAdmin(req)) return true;
  if (order.user.toString() === userId.toString()) return true;
  return false;
}

/** POST /api/orders — 장바구니 기준 주문 생성 */
export async function createOrder(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const body = req.body ?? {};
    let shippingAddress;
    let billingAddress;
    try {
      shippingAddress = normalizeShippingAddress(body.shippingAddress, "shippingAddress");
      if (body.billingAddress) {
        billingAddress = normalizeShippingAddress(body.billingAddress, "billingAddress");
      }
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const shippingFee = parseMoney(body.shippingFee, 0);
    const discountTotal = parseMoney(body.discountTotal, 0);
    const tax = parseMoney(body.tax, 0);
    if (shippingFee === null || discountTotal === null || tax === null) {
      return res.status(400).json({ error: "shippingFee, discountTotal, tax는 0 이상 숫자여야 합니다." });
    }

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "sku name price category image",
    });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: "장바구니가 비어 있습니다." });
    }

    const orderItems = [];
    let subtotal = 0;
    for (const line of cart.items) {
      const p = line.product;
      if (!p || !p._id) {
        return res.status(400).json({ error: "장바구니에 유효하지 않은 상품이 있습니다." });
      }
      const unitPrice = Number(p.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ error: `상품 가격이 올바르지 않습니다: ${p.sku}` });
      }
      const qty = Math.floor(Number(line.quantity));
      if (qty < 1) {
        return res.status(400).json({ error: "수량이 올바르지 않습니다." });
      }
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineTotal;
      orderItems.push({
        productId: p._id,
        sku: p.sku,
        name: p.name,
        image: p.image,
        category: p.category,
        unitPrice,
        quantity: qty,
        size: line.size,
        color: line.color,
        lineTotal,
      });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + shippingFee + tax - discountTotal) * 100) / 100;
    if (total < 0) {
      return res.status(400).json({ error: "최종 금액이 음수일 수 없습니다." });
    }

    const userDoc = await User.findById(userId).select("name email").lean();
    if (!userDoc) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const customerEmail = String(body.customerEmail ?? userDoc.email ?? req.auth.email ?? "")
      .trim()
      .toLowerCase();
    if (!customerEmail) {
      return res.status(400).json({ error: "customerEmail이 필요합니다." });
    }
    const customerName = String(body.customerName ?? userDoc.name ?? "").trim();
    if (!customerName) {
      return res.status(400).json({ error: "customerName이 필요합니다." });
    }
    const customerPhone =
      body.customerPhone === undefined || body.customerPhone === null
        ? undefined
        : String(body.customerPhone).trim();
    const note =
      body.note === undefined || body.note === null ? undefined : String(body.note).trim();

    const markPaid = Boolean(body.markPaid);

    // 1) 결제 고유값(idempotency) 기반 중복 체크 (예: PortOne/아임포트 imp_uid)
    const providerPaymentIdRaw =
      body.providerPaymentId === undefined || body.providerPaymentId === null
        ? ""
        : String(body.providerPaymentId).trim();
    const paymentProviderRaw =
      body.paymentProvider === undefined || body.paymentProvider === null
        ? ""
        : String(body.paymentProvider).trim();
    if (markPaid && providerPaymentIdRaw) {
      const dup = await Order.findOne({
        ...(paymentProviderRaw ? { "payment.provider": paymentProviderRaw } : {}),
        "payment.providerPaymentId": providerPaymentIdRaw,
      })
        .select("_id orderNumber status createdAt total")
        .lean();
      if (dup) {
        return res.status(409).json({
          error: "이미 처리된 결제입니다. 중복 주문을 생성할 수 없습니다.",
          orderId: dup._id,
          orderNumber: dup.orderNumber,
          status: dup.status,
        });
      }
    }

    const orderNumber = await generateUniqueOrderNumber();

    const doc = {
      user: userId,
      orderNumber,
      status: markPaid ? "paid" : "pending_payment",
      currency: String(body.currency ?? "USD").trim().toUpperCase() || "USD",
      subtotal,
      shippingFee,
      discountTotal,
      tax,
      total,
      items: orderItems,
      shippingAddress,
      billingAddress,
      customerEmail,
      customerName,
      customerPhone,
      note,
    };

    if (markPaid) {
      doc.payment = {
        method: String(body.paymentMethod ?? "mock").trim() || "mock",
        provider: String(body.paymentProvider ?? "demo").trim() || "demo",
        providerPaymentId:
          body.providerPaymentId === undefined
            ? `demo-${orderNumber}`
            : String(body.providerPaymentId).trim(),
        paidAt: new Date(),
        amount: total,
      };
    }

    // 2) 결제 고유값이 없을 때(데모/모의 결제 등) 더블클릭 방지용 중복 체크
    // 최근 몇 초 내 동일 사용자/동일 라인아이템/동일 금액이면 중복으로 간주
    // (카트 비우기 전 경쟁 상태에서 2번 생성되는 것을 완화)
    if (markPaid && !providerPaymentIdRaw) {
      const windowMs = 25_000;
      const since = new Date(Date.now() - windowMs);
      const recent = await Order.find({
        user: userId,
        createdAt: { $gte: since },
        status: { $in: ["paid", "pending_payment"] },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id orderNumber status createdAt subtotal shippingFee discountTotal tax total items")
        .lean();

      const nextFp = orderItemsFingerprint(orderItems);
      const dup = recent.find((o) => {
        if (!o) return false;
        if (Number(o.total) !== Number(total)) return false;
        if (Number(o.subtotal) !== Number(subtotal)) return false;
        if (Number(o.tax) !== Number(tax)) return false;
        if (Number(o.shippingFee) !== Number(shippingFee)) return false;
        if (Number(o.discountTotal) !== Number(discountTotal)) return false;
        return orderItemsFingerprint(o.items) === nextFp;
      });
      if (dup) {
        return res.status(409).json({
          error: "중복 주문 요청이 감지되었습니다. 잠시 후 다시 시도해 주세요.",
          orderId: dup._id,
          orderNumber: dup.orderNumber,
          status: dup.status,
        });
      }
    }

    const order = await Order.create(doc);
    cart.items = [];
    await cart.save();

    const populated = await Order.findById(order._id).lean();
    return res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000 || err.code === 11001) {
      return res.status(409).json({ error: "주문번호 충돌. 다시 시도해 주세요." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/orders — 본인 주문 목록 (관리자는 전체, ?status=) */
export async function listOrders(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const filter = {};
    if (!isAdmin(req)) {
      filter.user = userId;
    }
    const { status } = req.query;
    if (status !== undefined && status !== "") {
      if (!ORDER_STATUSES.includes(String(status))) {
        return res.status(400).json({ error: "유효하지 않은 status입니다." });
      }
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/orders/:id */
export async function getOrder(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "유효한 주문 id가 필요합니다." });
    }
    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }
    const ok = await assertOrderAccess(order, userId, req);
    if (!ok) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/orders/:id — 고객: pending_payment 시 note/배송지·취소 / 관리자: 상태·배송·결제 */
export async function updateOrder(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "유효한 주문 id가 필요합니다." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }
    const ok = await assertOrderAccess(order, userId, req);
    if (!ok) {
      return res.status(403).json({ error: "접근 권한이 없습니다." });
    }

    const body = req.body ?? {};

    if (isAdmin(req)) {
      if (body.status !== undefined) {
        if (!ORDER_STATUSES.includes(String(body.status))) {
          return res.status(400).json({ error: "유효하지 않은 status입니다." });
        }
        order.status = body.status;
        if (body.status === "shipping_started" && !order.shippedAt) {
          order.shippedAt = new Date();
        }
      }
      if (body.trackingNumber !== undefined) {
        order.trackingNumber =
          body.trackingNumber === null ? undefined : String(body.trackingNumber).trim();
      }
      if (body.carrier !== undefined) {
        order.carrier = body.carrier === null ? undefined : String(body.carrier).trim();
      }
      if (body.shippedAt !== undefined) {
        order.shippedAt = body.shippedAt === null ? undefined : new Date(body.shippedAt);
      }
      if (body.billingAddress !== undefined) {
        if (body.billingAddress === null) {
          order.billingAddress = undefined;
        } else {
          try {
            order.billingAddress = normalizeShippingAddress(body.billingAddress, "billingAddress");
          } catch (e) {
            return res.status(400).json({ error: e.message });
          }
        }
      }
      if (body.payment !== undefined && body.payment !== null && typeof body.payment === "object") {
        const pay = body.payment;
        if (!order.payment) {
          order.payment = {};
        }
        if (pay.method !== undefined) {
          order.payment.method = String(pay.method).trim();
        }
        if (pay.provider !== undefined) {
          order.payment.provider = String(pay.provider).trim();
        }
        if (pay.providerPaymentId !== undefined) {
          order.payment.providerPaymentId = String(pay.providerPaymentId).trim();
        }
        if (pay.paidAt !== undefined) {
          order.payment.paidAt =
            pay.paidAt === null ? undefined : new Date(pay.paidAt);
        }
        if (pay.amount !== undefined) {
          const a = parseMoney(pay.amount);
          if (a === null) {
            return res.status(400).json({ error: "payment.amount는 0 이상 숫자여야 합니다." });
          }
          order.payment.amount = a;
        }
      }
    } else {
      if (order.status !== "pending_payment") {
        return res.status(400).json({
          error: "결제 대기 중인 주문만 수정할 수 있습니다.",
        });
      }
      const allowedKeys = new Set(["note", "shippingAddress", "status"]);
      const keys = Object.keys(body);
      if (keys.some((k) => !allowedKeys.has(k))) {
        return res.status(403).json({ error: "허용되지 않은 필드입니다." });
      }
      if (body.status !== undefined && body.status !== "cancelled") {
        return res.status(400).json({ error: "고객은 status를 cancelled만 설정할 수 있습니다." });
      }
      if (body.status === "cancelled") {
        order.status = "cancelled";
      }
      if (body.note !== undefined) {
        order.note = body.note === null ? undefined : String(body.note).trim();
      }
      if (body.shippingAddress !== undefined) {
        try {
          order.shippingAddress = normalizeShippingAddress(
            body.shippingAddress,
            "shippingAddress",
          );
        } catch (e) {
          return res.status(400).json({ error: e.message });
        }
      }
    }

    await order.save();
    const fresh = await Order.findById(order._id).lean();
    return res.json(fresh);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/orders/:id — 관리자만, pending_payment 또는 cancelled */
export async function deleteOrder(req, res) {
  try {
    const userId = userIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다." });
    }
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "유효한 주문 id가 필요합니다." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }
    if (!["pending_payment", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        error: "결제 대기 또는 취소된 주문만 삭제할 수 있습니다.",
      });
    }
    await Order.deleteOne({ _id: id });
    return res.json({ deleted: true, orderNumber: order.orderNumber });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
