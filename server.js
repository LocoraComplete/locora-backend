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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



