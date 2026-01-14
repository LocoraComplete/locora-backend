const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");

// load env
dotenv.config();

// connect Mongo/Postgres
connectDB();

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// test route
app.get("/", (req, res) => {
  res.send("Locora Backend Running");
});

// routes
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const guideRoutes = require("./routes/guideRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const sosRoutes = require("./routes/sosRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const placeRoutes = require("./routes/placeRoutes");
const eventRoutes = require("./routes/eventRoutes");
const foodRoutes = require("./routes/foodRoutes");

app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/guide", guideRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/food", foodRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
