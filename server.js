const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");

// Load env variables
dotenv.config();

// Connect MongoDB
connectDB();

// Import models
const Message = require("./models/Message");
const User = require("./models/User");

// Create express app
const app = express();

// ------------------ MIDDLEWARE ------------------
// Parse JSON and URL-encoded bodies globally
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(cors());

// Serve static uploads
app.use("/uploads", express.static("uploads"));

// Test route
app.get("/", (req, res) => res.send("Locora Backend Running"));

// ---------------- SOCKET.IO SETUP ----------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] },
});

// Make io accessible inside routes
app.set("io", io);

// Track online users
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("register_user", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    console.log("User registered as online:", userId);
  });

  socket.on("join_chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { ChatId, SenderId, Text } = data;
      if (!ChatId || !SenderId || !Text) return;

      const chat = await require("./models/Chat").findOne({ ChatId });
      if (!chat) return;

      const newMessage = new Message({ ChatId, SenderId, Text, Status: "sent" });
      await newMessage.save();

      // Update chat last message
      chat.LastMessage = Text;
      chat.LastMessageTime = newMessage.CreatedAt;
      chat.LastMessageSender = SenderId;

      chat.Members.forEach((memberId) => {
        if (memberId !== SenderId) {
          const currentUnread = chat.UnreadCounts.get(memberId) || 0;
          chat.UnreadCounts.set(memberId, currentUnread + 1);
        }
      });

      await chat.save();

      const user = await User.findOne({ UserId: SenderId });

      io.to(ChatId).emit("receive_message", {
        MessageId: newMessage.MessageId,
        ChatId,
        SenderId,
        SenderName: user ? user.Handle : "User",
        Text,
        CreatedAt: newMessage.CreatedAt,
        Status: "sent",
      });
    } catch (error) {
      console.error("❌ send_message error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log("User removed from online:", userId);
        break;
      }
    }
  });
});

// ------------------ ROUTES ------------------
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/guide", require("./routes/guideRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/sos", require("./routes/sosRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/places", require("./routes/placeRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/food", require("./routes/foodRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));