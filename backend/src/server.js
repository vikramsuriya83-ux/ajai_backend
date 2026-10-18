import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const isServerless = Boolean(process.env.VERCEL);

if (isServerless) {
  connectDatabase().catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
} else {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`BharatKisan API running on http://localhost:${env.port}`);
  });
}

export default app;
