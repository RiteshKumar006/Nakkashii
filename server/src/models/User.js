import mongoose from "mongoose";
const { Schema } = mongoose;


const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        role: { type: String, enum: ["seller", "buyer"], default: "buyer" },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
