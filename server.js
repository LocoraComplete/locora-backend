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

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get("/", (req, res) => {
  res.send("Locora Backend Running");
});

// Routes
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

// ================= SOCKET.IO =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🟢 Track Online Users
// key = UserId
// value = socketId
const onlineUsers = new Map();

// Make it accessible in routes
global.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // ================= REGISTER USER =================
  socket.on("register_user", (userId) => {
    if (!userId) return;

    onlineUsers.set(userId, socket.id);
    console.log("User registered as online:", userId);
  });

  // ================= JOIN CHAT ROOM =================
  socket.on("join_chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // ================= SEND MESSAGE =================
  socket.on("send_message", async (data) => {
    try {
      const { ChatId, SenderId, Text } = data;

      if (!ChatId || !SenderId || !Text) {
        console.log("Invalid message payload");
        return;
      }

      // Save message to DB
      const newMessage = new Message({
        ChatId,
        SenderId,
        Text,
      });

      await newMessage.save();

      // Fetch sender (using custom UserId)
      const user = await User.findOne({ UserId: SenderId });

      const messageToSend = {
        MessageId: newMessage.MessageId,
        ChatId,
        SenderId,
        SenderName: user ? user.Handle : "User",
        Text,
        CreatedAt: newMessage.CreatedAt,
      };

      // Emit to room
      io.to(ChatId).emit("receive_message", messageToSend);

    } catch (error) {
      console.error("❌ send_message error:", error);
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    // Remove user from online map
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log("User removed from online:", userId);
        break;
      }
    }
  });
});

// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});