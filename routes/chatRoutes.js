const express = require("express");
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


module.exports = router;