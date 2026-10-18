import app from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

connectDatabase().catch((error) => {
  console.error("MongoDB connection failed:", error.message);
});

export default app;
