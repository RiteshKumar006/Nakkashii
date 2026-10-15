import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {ValidationError} from "../utils/error.js";

// images are stored on local disk in server/uploads and served at /uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new ValidationError("Only image files are allowed"));
        }
        cb(null, true);
    },
});

export function removeFile(filename) {
    fs.unlink(path.join(uploadDir, filename), () => {});
}
