const express = require("express");
const pool = require("../db");
// const { Pool } = require("pg");
// const dotenv = require("dotenv");

// dotenv.config();
const router = express.Router();

// const pool = new Pool({
//   user: process.env.DB_USER || "postgres",
//   host: process.env.DB_HOST || "localhost",
//   database: process.env.DB_NAME || "htaa_db",
//   password: process.env.DB_PASSWORD || "your_password",
//   port: process.env.DB_PORT || 5432,
// });

// Get all bookmarks for a user
router.get("/user/:google_id", async (req, res) => {
  const { google_id } = req.params;

  try {
    // First get user_id from google_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Get bookmarks
    const result = await pool.query(
      `SELECT test_id, test_name, category_name, category_id, bookmarked_at
       FROM bookmarks
       WHERE user_id = $1
       ORDER BY test_name ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching bookmarks:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add a bookmark
router.post("/", async (req, res) => {
  const { google_id, test_id, test_name, category_name, category_id } =
    req.body;

  if (!google_id || !test_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Get user_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Insert bookmark
    const result = await pool.query(
      `INSERT INTO bookmarks (user_id, test_id, test_name, category_name, category_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, test_id) DO NOTHING
       RETURNING *`,
      [userId, test_id, test_name, category_name, category_id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: "Bookmark already exists" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding bookmark:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Batch add bookmarks (for syncing multiple bookmarks at once)
router.post("/batch", async (req, res) => {
  const { google_id, bookmarks } = req.body;

  if (!google_id || !Array.isArray(bookmarks) || bookmarks.length === 0) {
    return res
      .status(400)
      .json({ error: "Missing required fields or empty bookmarks array" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user_id
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Insert bookmarks
    const addedBookmarks = [];
    const skippedBookmarks = [];

    for (const bookmark of bookmarks) {
      const { test_id, test_name, category_name, category_id } = bookmark;

      if (!test_id) {
        skippedBookmarks.push({ bookmark, reason: "Missing test_id" });
        continue;
      }

      try {
        const result = await client.query(
          `INSERT INTO bookmarks (user_id, test_id, test_name, category_name, category_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, test_id) DO NOTHING
           RETURNING *`,
          [userId, test_id, test_name, category_name, category_id]
        );

        if (result.rows.length > 0) {
          addedBookmarks.push(result.rows[0]);
        } else {
          skippedBookmarks.push({ bookmark, reason: "Already exists" });
        }
      } catch (err) {
        console.error(`Error adding bookmark ${test_id}:`, err);
        skippedBookmarks.push({ bookmark, reason: err.message });
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Batch operation completed",
      added: addedBookmarks.length,
      skipped: skippedBookmarks.length,
      addedBookmarks,
      skippedBookmarks,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in batch add bookmarks:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

// Batch delete bookmarks (for syncing multiple deletions at once)
router.post("/batch-delete", async (req, res) => {
  const { google_id, test_ids } = req.body;

  if (!google_id || !Array.isArray(test_ids) || test_ids.length === 0) {
    return res
      .status(400)
      .json({ error: "Missing required fields or empty test_ids array" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user_id
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Delete bookmarks using ANY operator for efficient batch deletion
    const result = await client.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND test_id = ANY($2) RETURNING test_id",
      [userId, test_ids]
    );

    await client.query("COMMIT");

    const deletedCount = result.rows.length;
    const notFoundCount = test_ids.length - deletedCount;

    res.json({
      message: "Batch delete completed",
      deleted: deletedCount,
      notFound: notFoundCount,
      deletedIds: result.rows.map((row) => row.test_id),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in batch delete bookmarks:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

// Remove a bookmark
router.delete("/:google_id/:test_id", async (req, res) => {
  const { google_id, test_id } = req.params;

  try {
    // Get user_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    // If user doesn't exist, bookmark doesn't exist either - return 404 but not an error
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Bookmark not found (user doesn't exist)",
        deleted: false,
      });
    }

    const userId = userResult.rows[0].id;

    // Delete bookmark
    const result = await pool.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND test_id = $2 RETURNING *",
      [userId, test_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Bookmark not found",
        deleted: false,
      });
    }

    res.json({
      message: "Bookmark removed",
      deleted: true,
    });
  } catch (err) {
    console.error("Error removing bookmark:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/user/:google_id", async (req, res) => {
  const { google_id } = req.params;

  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    // THIS LINE MUST RETURN res.json(), NOT res.status(404)
    if (userResult.rows.length === 0) {
      return res.json({
        message: "No bookmarks to clear (user not found)",
        deletedCount: 0,
      });
    }

    const userId = userResult.rows[0].id;
    const result = await pool.query(
      "DELETE FROM bookmarks WHERE user_id = $1 RETURNING test_id",
      [userId]
    );

    res.json({
      message: "All bookmarks cleared",
      deletedCount: result.rows.length,
    });
  } catch (err) {
    console.error("Error clearing bookmarks:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Sync endpoint - handles both additions and deletions in one transaction
router.post("/sync", async (req, res) => {
  const { google_id, additions = [], deletions = [] } = req.body;

  if (!google_id) {
    return res.status(400).json({ error: "Missing google_id" });
  }

  if (additions.length === 0 && deletions.length === 0) {
    return res.status(400).json({ error: "No sync operations provided" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user_id
    const userResult = await client.query(
      "SELECT id FROM users WHERE google_id = $1",
      [google_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Process deletions first
    let deletedCount = 0;
    if (deletions.length > 0) {
      const deleteResult = await client.query(
        "DELETE FROM bookmarks WHERE user_id = $1 AND test_id = ANY($2) RETURNING test_id",
        [userId, deletions]
      );
      deletedCount = deleteResult.rows.length;
    }

    // Process additions
    const addedBookmarks = [];
    const skippedBookmarks = [];

    for (const bookmark of additions) {
      const { test_id, test_name, category_name, category_id } = bookmark;

      if (!test_id) {
        skippedBookmarks.push({ bookmark, reason: "Missing test_id" });
        continue;
      }

      try {
        const result = await client.query(
          `INSERT INTO bookmarks (user_id, test_id, test_name, category_name, category_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, test_id) DO NOTHING
           RETURNING *`,
          [userId, test_id, test_name, category_name, category_id]
        );

        if (result.rows.length > 0) {
          addedBookmarks.push(result.rows[0]);
        } else {
          skippedBookmarks.push({ bookmark, reason: "Already exists" });
        }
      } catch (err) {
        console.error(`Error adding bookmark ${test_id}:`, err);
        skippedBookmarks.push({ bookmark, reason: err.message });
      }
    }

    await client.query("COMMIT");

    res.json({
      message: "Sync completed successfully",
      deleted: deletedCount,
      added: addedBookmarks.length,
      skipped: skippedBookmarks.length,
      details: {
        addedBookmarks,
        skippedBookmarks,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in sync operation:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

module.exports = router;
