import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";

dotenv.config();

const users = [
    { name: "Asha Weaves", email: "seller1@nakkashii.test", role: "seller" },
    { name: "Kiran Crafts", email: "seller2@nakkashii.test", role: "seller" },
    { name: "Demo Buyer", email: "buyer@nakkashii.test", role: "buyer" },
];

// builds options from pairs like ["Colour", "White", "Size", "M"]
function opts(...pairs) {
    const options = [];
    for (let i = 0; i < pairs.length; i += 2) {
        options.push({ name: pairs[i], value: pairs[i + 1] });
    }
    return options;
}

function demoProducts(seller1, seller2) {
    return [
        {
            sellerId: seller1,
            name: "Classic Cotton Tee",
            description: "Everyday crew neck tee in 100% combed cotton.",
            category: "T-shirts",
            attributes: ["Colour", "Size"],
            variants: [
                { sku: "TEE-WHT-S", options: opts("Colour", "White", "Size", "S"), price: 499, stock: 15 },
                { sku: "TEE-WHT-M", options: opts("Colour", "White", "Size", "M"), price: 499, stock: 20 },
                { sku: "TEE-WHT-L", options: opts("Colour", "White", "Size", "L"), price: 549, stock: 8 },
                { sku: "TEE-BLK-S", options: opts("Colour", "Black", "Size", "S"), price: 499, stock: 0 },
                { sku: "TEE-BLK-M", options: opts("Colour", "Black", "Size", "M"), price: 499, stock: 12 },
                { sku: "TEE-BLK-L", options: opts("Colour", "Black", "Size", "L"), price: 549, stock: 3 },
                { sku: "TEE-NVY-S", options: opts("Colour", "Navy", "Size", "S"), price: 499, stock: 6 },
                { sku: "TEE-NVY-M", options: opts("Colour", "Navy", "Size", "M"), price: 499, stock: 4 },
                // no Navy / L, so that combination doesn't exist
            ],
        },
        {
            sellerId: seller1,
            name: "Slim Fit Jeans",
            description: "Stretch denim jeans with a mid rise.",
            category: "Jeans",
            attributes: ["Fit", "Waist"],
            variants: [
                { sku: "JEAN-SLIM-30", options: opts("Fit", "Slim", "Waist", "30"), price: 1499, stock: 7 },
                { sku: "JEAN-SLIM-32", options: opts("Fit", "Slim", "Waist", "32"), price: 1499, stock: 10 },
                { sku: "JEAN-SLIM-34", options: opts("Fit", "Slim", "Waist", "34"), price: 1499, stock: 0 },
                { sku: "JEAN-REG-30", options: opts("Fit", "Regular", "Waist", "30"), price: 1399, stock: 5 },
                { sku: "JEAN-REG-32", options: opts("Fit", "Regular", "Waist", "32"), price: 1399, stock: 9 },
                { sku: "JEAN-REG-34", options: opts("Fit", "Regular", "Waist", "34"), price: 1399, stock: 4, isAvailable: false },
            ],
        },
        {
            sellerId: seller2,
            name: "Graphic Print T-shirt",
            description: "Oversized tee with a screen printed graphic on the back.",
            category: "T-shirts",
            attributes: ["Size"],
            variants: [
                { sku: "GFX-M", options: opts("Size", "M"), price: 699, stock: 10 },
                { sku: "GFX-L", options: opts("Size", "L"), price: 699, stock: 2 },
                { sku: "GFX-XL", options: opts("Size", "XL"), price: 749, stock: 0 },
            ],
        },
        {
            sellerId: seller2,
            name: "Leather Biker Jacket",
            description: "Genuine leather jacket, one size with an adjustable waist belt.",
            category: "Jackets",
            attributes: [],
            variants: [{ sku: "JKT-LEATHER", options: [], price: 5999, stock: 3 }],
        },
        {
            sellerId: seller2,
            name: "Denim Jacket",
            description: "Washed denim trucker jacket. Sold out in every size right now.",
            category: "Jackets",
            attributes: ["Colour", "Size"],
            variants: [
                { sku: "JKT-DEN-BLU-M", options: opts("Colour", "Blue", "Size", "M"), price: 2499, stock: 0 },
                { sku: "JKT-DEN-BLU-L", options: opts("Colour", "Blue", "Size", "L"), price: 2499, stock: 0 },
                { sku: "JKT-DEN-BLK-M", options: opts("Colour", "Black", "Size", "M"), price: 2599, stock: 0, isAvailable: false },
            ],
        },
    ];
}

const seed = async () => {
    try{
        await connectDB();

        for (const user of users) {
            await User.updateOne({ email: user.email }, { $set: user }, { upsert: true });
        }

        console.log("Users seeded:");
        users.forEach((u) => console.log(`${u.role} - ${u.email}`));

        const seller1 = await User.findOne({ email: "seller1@nakkashii.test" });
        const seller2 = await User.findOne({ email: "seller2@nakkashii.test" });

        // start the demo products fresh on every run
        await Product.deleteMany({ sellerId: { $in: [seller1._id, seller2._id] } });
        await Product.syncIndexes();
        const products = await Product.create(demoProducts(seller1._id, seller2._id));
        console.log(`Products seeded: ${products.length}`);
    }catch(err){
        console.error("Seed failed:", err);
        process.exitCode = 1;
    }finally{
        await mongoose.disconnect();
    }
}

seed();
