const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// GET /api/users - get all users (for testing)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-Password"); // exclude passwords
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/register - add a new user
router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password, Phone, Gender } = req.body;

    // Check if email or phone already exists
    const existingUser = await User.findOne({ 
      $or: [{ Email }, { Phone }] 
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or phone already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Create new user (UserId will auto-generate)
    const newUser = new User({
      Name,
      Email,
      Password: hashedPassword,
      Phone,
      Gender
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
