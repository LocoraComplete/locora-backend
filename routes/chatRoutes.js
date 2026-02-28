const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");


// ================= CREATE GROUP =================
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

// =============================
// RECOMMENDED GROUPS
// =============================
router.get("/recommend/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const chats = await Chat.find({
      Members: { $nin: [userId] }, // NOT IN members array
    }).sort({ CreatedOn: -1 });

    res.json(chats);

  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= JOIN GROUP =================
router.post("/join", async (req, res) => {
  try {
    const { ChatId, UserId } = req.body;

    const chat = await Chat.findOne({ ChatId });
    if (!chat) return res.status(404).json({ message: "Group not found" });

    if (chat.Members.includes(UserId)) {
      return res.json({ message: "Already a member" });
    }

    const user = await User.findOne({ UserId });
    if (!user) return res.status(400).json({ message: "Invalid user" });

    chat.Members.push(UserId);
    await chat.save();

    const systemText = `${user.Handle} joined the group`;

    const systemMessage = new Message({
      ChatId,
      SenderId: UserId,
      Text: systemText,
      IsSystem: true,
    });

    await systemMessage.save();

    const io = req.app.get("io");

    io.to(ChatId).emit("receive_message", {
      ChatId,
      SenderId: UserId,
      SenderName: "System",
      Text: systemText,
      IsSystem: true,
    });

    res.json({ message: "Joined successfully" });

  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= LEAVE GROUP =================
router.delete("/leave/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const chat = await Chat.findOne({ ChatId: chatId });
    if (!chat) return res.status(404).json({ message: "Group not found" });

    if (!chat.Members.includes(userId)) {
      return res.status(400).json({ message: "Not a member" });
    }

    chat.Members = chat.Members.filter(id => id !== userId);
    await chat.save();

    const user = await User.findOne({ UserId: userId });

    const systemText = `${user.Handle} left the group`;

    const systemMessage = new Message({
      ChatId: chatId,
      SenderId: userId,
      Text: systemText,
      IsSystem: true,
    });

    await systemMessage.save();

    const io = req.app.get("io");

    io.to(chatId).emit("receive_message", {
      ChatId: chatId,
      SenderId: userId,
      SenderName: "System",
      Text: systemText,
      IsSystem: true,
    });

    res.json({ message: "Left successfully" });

  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= DELETE GROUP =================
router.delete("/delete/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const chat = await Chat.findOne({ ChatId: chatId });
    if (!chat) return res.status(404).json({ message: "Group not found" });

    if (chat.CreatedBy !== userId) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await Message.deleteMany({ ChatId: chatId });
    await Chat.deleteOne({ ChatId: chatId });

    res.json({ message: "Group deleted successfully" });

  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= USER GROUPS =================
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


// ================= GROUP DETAILS =================
router.get("/details/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findOne({ ChatId: req.params.chatId });
    if (!chat) return res.status(404).json({ message: "Group not found" });

    const members = await User.find({
      UserId: { $in: chat.Members },
    }).select("UserId Handle");

    res.json({
      ChatId: chat.ChatId,
      GroupName: chat.GroupName,
      Description: chat.Description,
      CreatedBy: chat.CreatedBy,
      CreatedOn: chat.CreatedOn,
      Members: members,
      TotalMembers: members.length,
    });

  } catch (err) {
    console.error("Group details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= ONLINE MEMBERS =================
router.get("/online/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findOne({ ChatId: req.params.chatId });
    if (!chat) return res.status(404).json({ message: "Group not found" });

    const online = chat.Members.filter(memberId =>
      global.onlineUsers?.has(memberId)
    );

    res.json({ online });

  } catch (err) {
    console.error("Online members error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;