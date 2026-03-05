const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const Chat = require("../models/Chat");

/* =========================================================
   GET MESSAGES (ONLY MEMBERS)
   - Validates membership
   - Marks messages as seen
   - Resets unread counter
========================================================= */
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const chat = await Chat.findOne({ ChatId: chatId });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    //  Membership Check
    if (!chat.Members.includes(userId)) {
      return res.status(403).json({
        message: "Access denied. You are not a member of this chat.",
      });
    }

    /* =====================================================
       RESET UNREAD COUNT FOR THIS USER
    ===================================================== */
    if (chat.UnreadCounts && chat.UnreadCounts.get(userId) !== undefined) {
      chat.UnreadCounts.set(userId, 0);
      await chat.save();
    }

    /* =====================================================
       MARK MESSAGES AS SEEN
       - Only messages not sent by this user
    ===================================================== */
    await Message.updateMany(
      {
        ChatId: chatId,
        SenderId: { $ne: userId },
        Status: { $ne: "seen" },
      },
      { $set: { Status: "seen" } }
    );

    /* =====================================================
       FETCH MESSAGES
    ===================================================== */
    const messages = await Message.find({ ChatId: chatId })
      .sort({ CreatedAt: 1 })
      .lean();

    const senderIds = [
      ...new Set(
        messages
          .filter((m) => m.SenderId)
          .map((m) => m.SenderId)
      ),
    ];

    const users = await User.find({ UserId: { $in: senderIds } })
      .select("UserId Handle")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u.UserId] = u.Handle;
    });

    const messagesWithUser = messages.map((msg) => ({
      MessageId: msg.MessageId,
      ChatId: msg.ChatId,
      SenderId: msg.SenderId,
      SenderName: msg.IsSystem
        ? "System"
        : userMap[msg.SenderId] || "User",
      Text: msg.Text,
      CreatedAt: msg.CreatedAt,
      IsSystem: msg.IsSystem || false,
      Status: msg.Status || "sent", 
    }));

    res.json(messagesWithUser);

  } catch (err) {
    console.error("Message fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;