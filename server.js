const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// load env
dotenv.config();

// connect mongo
connectDB();

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// test route
app.get("/", (req, res) => {
  res.send("Locora Backend Running");
});

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profiles", profileRoutes);

const guideRoutes = require("./routes/guideRoutes");
app.use("/api/guide", guideRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

app.use("/api/messages", require("./routes/messageRoutes"));

const sosRoutes = require("./routes/sosRoutes");
app.use("/api/sos", sosRoutes);

app.use("/api/reviews", require("./routes/reviewRoutes"));
const placeRoutes = require("./routes/placeRoutes");
app.use("/api/places", placeRoutes);

const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

const foodRoutes = require("./routes/foodRoutes");
app.use("/api/food", foodRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});





