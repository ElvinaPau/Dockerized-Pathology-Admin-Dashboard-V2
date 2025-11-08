const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "htaa_db",
  password: process.env.DB_PASSWORD || "your_password",
  port: process.env.DB_PORT || 5432,
});

// Create or update user
router.post("/", async (req, res) => {
  const { google_id, name, email, photo_url } = req.body;

  if (!google_id || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (google_id, name, email, photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id)
       DO UPDATE SET 
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         photo_url = EXCLUDED.photo_url,
         updated_at = NOW()
       RETURNING *`,
      [google_id, name, email, photo_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
