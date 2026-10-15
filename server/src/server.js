import dotenv from 'dotenv';
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Nakkashii API running on port ${PORT}`);
  });
};

startServer();
