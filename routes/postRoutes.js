const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const getNextSequence = require("../utils/generateId");
const upload = require("../middlewares/upload");
const path = require("path");

// ================= CREATE POST =================
router.post("/create", upload.single("image"), async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const { UserId } = req.body;
    if (!UserId) return res.status(400).json({ message: "UserId required" });
    if (!req.file) return res.status(400).json({ message: "Image required" });

    const newPost = new Post({
  PostId: `P${Date.now()}`, // ✅ temporary unique PostId
  UserId,
  ImageId: req.file.filename,
});

    await newPost.save();

    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET IMAGE =================
router.get("/image/:filename", (req, res) => {
  const { filename } = req.params;

  if (!filename || filename === "undefined") {
    return res.status(400).json({ message: "Invalid filename" });
  }

  const imagePath = path.join(__dirname, "../uploads", filename);

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: "Image not found" });
    }
  });
});

// ================= GET POSTS BY USER =================
router.get("/user/:UserId", async (req, res) => {
  try {
    const { UserId } = req.params;

    const posts = await Post.find({ UserId }).sort({ createdAt: -1 });

    const baseUrl =
      process.env.BASE_URL || `http://${req.headers.host}`;

    const formattedPosts = posts.map((post) => ({
      PostId: post.PostId,
      ImageUrl: `${baseUrl}/api/posts/image/${post.ImageId}`,
    }));

    res.json(formattedPosts);

  } catch (error) {
    console.error("GET USER POSTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;