import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";

process.env.JWT_SECRET = "test-secret";

let mongo;

// each test file gets its own in-memory mongo, no real database needed
export async function startDB() {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Product.init(); // make sure the unique sku index exists
}

export async function stopDB() {
    await mongoose.disconnect();
    await mongo.stop();
}

export async function clearDB() {
    await User.deleteMany({});
    await Product.deleteMany({});
}

export async function createUsers() {
    const [seller1, seller2, buyer] = await User.create([
        { name: "Seller One", email: "seller1@test.com", role: "seller" },
        { name: "Seller Two", email: "seller2@test.com", role: "seller" },
        { name: "Buyer", email: "buyer@test.com", role: "buyer" },
    ]);
    return { seller1, seller2, buyer };
}

export function scarfData() {
    return {
        name: "Scarf",
        description: "Cotton scarf",
        category: "Scarves",
        attributes: ["Colour", "Size"],
        variants: [
            {
                sku: "SC-RED-S",
                options: [{ name: "Colour", value: "Red" }, { name: "Size", value: "S" }],
                price: 500,
                stock: 10,
                isAvailable: true,
            },
            {
                sku: "SC-BLUE-S",
                options: [{ name: "Colour", value: "Blue" }, { name: "Size", value: "S" }],
                price: 500,
                stock: 0,
                isAvailable: true,
            },
        ],
    };
}
