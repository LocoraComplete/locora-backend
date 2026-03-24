const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const getNextSequence = require("../utils/generateId");
const upload = require("../middlewares/upload");
const path = require("path");
const User = require("../models/User");

// ================= CREATE POST =================
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const { UserId, Caption } = req.body;

    if (!UserId) return res.status(400).json({ message: "UserId required" });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "At least one image required" });

    const imageIds = req.files.map(file => file.filename);

    const newPost = new Post({
      PostId: `P${Date.now()}`,
      UserId,
      ImageIds: imageIds,
      Caption
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
      ImageUrls: post.ImageIds.map(id => `${baseUrl}/api/posts/image/${id}`)
    }));

    res.json(formattedPosts);

  } catch (error) {
    console.error("GET USER POSTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= FEED =================
router.get("/feed", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const currentUserId = req.query.UserId;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const baseUrl =
      process.env.BASE_URL || `http://${req.headers.host}`;

    const feed = await Promise.all(
      posts.map(async (post) => {

        const user = await User.findOne({ UserId: post.UserId });

        const liked = currentUserId
          ? post.likes.some(id => id.toString() === currentUserId.toString())
          : false;

        let handle = "Deleted User";
        let profilePic = "";

        if (user && !user.isDeleted) {
          handle = user.Handle || "user";
          profilePic = user.profilePic
            ? `${baseUrl}${user.profilePic}`
            : "";
        }

        return {
          PostId: post.PostId,
          UserId: post.UserId,
          handle,
          profilePic,
          ImageUrl: `${baseUrl}/api/posts/image/${post.ImageIds[0]}`,
          likes: post.likes.length,
          comments: post.comments.length,
          likedByUser: liked
        };
      })
    );

    res.json(feed);

  } catch (err) {
    console.log("FEED ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LIKE POSTS =================
router.post("/like", async (req,res)=>{
  try{

    const {PostId,UserId} = req.body;

    const post = await Post.findOne({PostId});
    if(!post) return res.status(404).json({message:"Post not found"});

    const alreadyLiked = post.likes.includes(UserId);

    if(alreadyLiked){
      post.likes = post.likes.filter(id=>id!==UserId);
    }else{
      post.likes.push(UserId);
    }

    await post.save();

    res.json({likes:post.likes.length,liked:!alreadyLiked});

  }catch(err){
    res.status(500).json({message:"Server error"});
  }
});

// ================= COMMENT =================
router.post("/comment", async (req,res)=>{
  try{

    const {PostId,UserId,text} = req.body;

    if(!text || text.trim()===""){
      return res.status(400).json({message:"Comment empty"});
    }

    const post = await Post.findOne({PostId});
    if(!post) return res.status(404).json({message:"Post not found"});

    const newComment = {
      UserId,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);

    await post.save();

    res.json({
      message:"Comment added",
      comment:newComment,
      totalComments: post.comments.length
    });

  }catch(err){
    console.log("COMMENT ERROR:",err);
    res.status(500).json({message:"Server error"});
  }
});

// ================= GET COMMENTS =================
router.get("/comments/:PostId", async (req, res) => {
  try {

    const { PostId } = req.params;

    const post = await Post.findOne({ PostId });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const users = await User.find({
      UserId: { $in: post.comments.map(c => c.UserId) }
    });

    const baseUrl =
      process.env.BASE_URL || `http://${req.headers.host}`;

    const formattedComments = post.comments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => {

        const user = users.find(u => u.UserId === c.UserId);

        let handle = "Deleted User";
        let profilePic = "";

        if (user && !user.isDeleted) {
          handle = user.Handle || "user";
          profilePic = user.profilePic
            ? `${baseUrl}${user.profilePic}`
            : "";
        }

        return {
          UserId: c.UserId,
          handle,
          profilePic,
          text: c.text,
          createdAt: c.createdAt
        };
      });
    res.json(formattedComments);

  } catch (err) {
    console.log("GET COMMENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET SINGLE POST =================
router.get("/:PostId", async (req, res) => {
  try {
    const { PostId } = req.params;
    const currentUserId = req.query.UserId;

    const post = await Post.findOne({ PostId });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const baseUrl =
        process.env.BASE_URL || `http://${req.headers.host}`;

    const liked = currentUserId
      ? post.likes.some(id => id.toString() === currentUserId.toString())
      : false;

    res.json({
      PostId: post.PostId,
      UserId: post.UserId,
      Caption: post.Caption,
      ImageUrls: post.ImageIds.map(
        id => `${baseUrl}/api/posts/image/${id}`
      ),
      likes: post.likes.length,
      likedByUser: liked,
      commentsCount: post.comments.length
    });

  } catch (err) {
    console.log("GET POST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE POST =================
router.delete("/:PostId", async (req, res) => {
  try {
    const { PostId } = req.params;
    const { UserId } = req.body;

    const post = await Post.findOne({ PostId });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only owner can delete
    if (post.UserId !== UserId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.deleteOne({ PostId });

    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    console.log("DELETE POST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;