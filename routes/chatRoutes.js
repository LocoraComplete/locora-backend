const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");

// Create new chat group
router.post("/create-chat", async (req, res) => {
  try {
    const { GroupName, CreatedBy } = req.body;

    // Validate creator user exists
    const user = await User.findOne({ UserId: CreatedBy });

    if (!user) {
      return res.status(400).json({
        message: "Invalid CreatedBy — UserId does not exist"
      });
    }

    const newChat = new Chat({
      GroupName,
      CreatedBy
    });

    await newChat.save();

    res.status(201).json({
      message: "Chat group created successfully",
      chat: newChat
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all chats
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ CreatedOn: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
