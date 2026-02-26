/*const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");


// ===============================
// CREATE GROUP
// ===============================
router.post("/create", async (req, res) => {
  try {
    const { GroupName, Description, CreatedBy } = req.body;

    if (!GroupName || !CreatedBy) {
      return res.status(400).json({ message: "GroupName and CreatedBy required" });
    }

    const user = await User.findOne({ UserId: CreatedBy });
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const newChat = new Chat({
      GroupName,
      Description,
      CreatedBy,
      Members: [CreatedBy],
    });

    await newChat.save();

    res.status(201).json(newChat);

  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// JOIN GROUP
// ===============================
router.post("/join", async (req, res) => {
  try {
    const { ChatId, UserId } = req.body;

    const chat = await Chat.findOne({ ChatId });
    if (!chat) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!chat.Members.includes(UserId)) {
      chat.Members.push(UserId);
      await chat.save();
    }

    res.json({ message: "Joined successfully" });

  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// GET MY GROUPS
// ===============================
router.get("/user/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({
      Members: req.params.userId,
    }).sort({ CreatedOn: -1 });

    res.json(chats);

  } catch (err) {
    console.error("User groups error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// RECOMMENDED GROUPS
// ===============================
router.get("/recommend/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({
      Members: { $ne: req.params.userId },
    }).limit(10);

    res.json(chats);

  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// SEARCH GROUPS
// ===============================
router.get("/search/:query", async (req, res) => {
  try {
    const chats = await Chat.find({
      GroupName: { $regex: req.params.query, $options: "i" },
    }).limit(20);

    res.json(chats);

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router; */
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");


// ===============================
// CREATE GROUP
// ===============================
router.post("/create", async (req, res) => {
  try {
    const { GroupName, Description, CreatedBy } = req.body;

    if (!GroupName || !CreatedBy) {
      return res.status(400).json({ message: "GroupName and CreatedBy required" });
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(CreatedBy)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // ✅ Use Mongo _id
    const user = await User.findById(CreatedBy);
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const newChat = new Chat({
      GroupName,
      Description,
      CreatedBy,
      Members: [CreatedBy],
    });

    await newChat.save();

    res.status(201).json(newChat);

  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// JOIN GROUP
// ===============================
router.post("/join", async (req, res) => {
  try {
    const { ChatId, UserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ChatId) || 
        !mongoose.Types.ObjectId.isValid(UserId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // ✅ Use _id instead of ChatId
    const chat = await Chat.findById(ChatId);
    if (!chat) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!chat.Members.includes(UserId)) {
      chat.Members.push(UserId);
      await chat.save();
    }

    res.json({ message: "Joined successfully" });

  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// GET MY GROUPS
// ===============================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chats = await Chat.find({
      Members: userId,
    }).sort({ createdAt: -1 });

    res.json(chats);

  } catch (err) {
    console.error("User groups error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// RECOMMENDED GROUPS
// ===============================
router.get("/recommend/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({
      Members: { $ne: userId },
    }).limit(10);

    res.json(chats);

  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// SEARCH GROUPS
// ===============================
router.get("/search/:query", async (req, res) => {
  try {
    const chats = await Chat.find({
      GroupName: { $regex: req.params.query, $options: "i" },
    }).limit(20);

    res.json(chats);

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
