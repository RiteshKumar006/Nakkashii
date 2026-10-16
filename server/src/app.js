import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from "./middleware/errorHandler.js";
import {NotFoundError} from "./utils/error.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import { uploadDir } from "./config/upload.js";

// app is separate from server.js so tests can use it without listening on a port
const app = express();

app.use(helmet());

app.use(cors(
    {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
    }
));

app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
    res.status(200).json(
        { message : "API running",
          success : true,
         }
    );
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/seller", sellerRoutes);

app.use((req, res, next) => {
    next(new NotFoundError("Route not found"));
});
app.use(errorHandler);

export default app;
