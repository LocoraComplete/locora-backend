const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// Get messages for a chat
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ ChatId: req.params.chatId })
      .sort({ CreatedAt: 1 });

    const messagesWithUser = await Promise.all(
      messages.map(async (msg) => {
        const user = await User.findOne({ UserId: msg.SenderId }); 

        return {
          MessageId: msg.MessageId,
          ChatId: msg.ChatId,
          SenderId: msg.SenderId,
          SenderName: user ? user.Handle : "User",
          Text: msg.Text,
          CreatedAt: msg.CreatedAt,
        };
      })
    );

    res.json(messagesWithUser);

  } catch (err) {
    console.error("❌ Message fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;