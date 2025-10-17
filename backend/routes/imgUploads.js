const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure the folder exists
const imgUploadDir = path.join(__dirname, "../imgUploads");
if (!fs.existsSync(imgUploadDir)) {
  fs.mkdirSync(imgUploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imgUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// POST /api/uploads/image
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Return accessible URL
  const imageUrl = `/imgUploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

module.exports = router;
