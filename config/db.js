const mongoose = require("mongoose");
const { Pool } = require("pg");

let pool = null;

const connectDB = async () => {
  // MongoDB path
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
      return "mongo";
    } catch (err) {
      console.error("❌ MongoDB connection failed", err);
      process.exit(1);
    }
  }

  // Postgres fallback (Neon / Render)
  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await pool.query("SELECT 1");
      console.log("✅ Postgres (Neon) connected");
      return "postgres";
    } catch (err) {
      console.error("❌ Postgres connection failed", err);
      process.exit(1);
    }
  }

  console.error("❌ No database URL provided!");
  process.exit(1);
};

const getPgPool = () => pool;

module.exports = { connectDB, getPgPool };
