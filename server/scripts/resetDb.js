import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@shopping-mall.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin1234";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";

function sampleProducts() {
  return [
    {
      sku: "SKU-TSHIRT-001",
      name: "Everyday Tee",
      price: 19.99,
      category: "Tops & Blouses",
      image: "https://picsum.photos/seed/tee/640/640",
      description: "Soft cotton tee for daily wear.",
    },
    {
      sku: "SKU-DRESS-001",
      name: "Summer Dress",
      price: 59.0,
      category: "Dresses & Skirts",
      image: "https://picsum.photos/seed/dress/640/640",
      description: "Lightweight dress for warm days.",
    },
    {
      sku: "SKU-JEANS-001",
      name: "Straight Jeans",
      price: 79.0,
      category: "Jeans",
      image: "https://picsum.photos/seed/jeans/640/640",
      description: "Classic straight fit denim.",
    },
    {
      sku: "SKU-JACKET-001",
      name: "Cropped Jacket",
      price: 120.0,
      category: "Vests & Jackets",
      image: "https://picsum.photos/seed/jacket/640/640",
      description: "Easy layer for transitional weather.",
    },
    {
      sku: "SKU-ACC-001",
      name: "Minimal Tote",
      price: 35.0,
      category: "Accessories",
      image: "https://picsum.photos/seed/tote/640/640",
      description: "Roomy tote for everyday essentials.",
    },
  ];
}

async function main() {
  await connectDb();

  await mongoose.connection.dropDatabase();

  const admin = await User.create({
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    password: ADMIN_PASSWORD,
    user_type: "admin",
  });

  await Product.insertMany(sampleProducts(), { ordered: false });

  console.log("Database reset complete.");
  console.log(`Admin: ${admin.email} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

