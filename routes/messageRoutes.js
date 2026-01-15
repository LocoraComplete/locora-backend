const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

// Send message
router.post("/send", async (req, res) => {
  try {
    const { ChatId, SenderId, Text } = req.body;

    if (!ChatId || !SenderId || !Text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(ChatId)) {
      return res.status(400).json({ message: "Invalid Chat ID" });
    }

    const chat = await Chat.findById(ChatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const user = await User.findOne({ UserId: SenderId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const message = new Message({
      ChatId,
      SenderId,
      Text
    });

    await message.save();

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a chat
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ ChatId: req.params.chatId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
