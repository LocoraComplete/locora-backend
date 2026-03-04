const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ======================
// CHECK OLD PASSWORD
// ======================
router.post("/:UserId/check-password", async (req, res) => {
  try {
    const { UserId } = req.params;
    const { oldPassword } = req.body;

    if (!oldPassword || oldPassword.length < 6) {
      return res.status(400).json({ valid: false, message: "Invalid old password" });
    }

    const user = await User.findOne({ UserId });
    if (!user) return res.status(404).json({ valid: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) return res.status(200).json({ valid: false });

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error("❌ CHECK PASSWORD ERROR:", error);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
});

// ======================
// UPDATE PASSWORD
// ======================
router.put("/:UserId/update-password", async (req, res) => {
  try {
    const { UserId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Invalid new password" });
    }

    const user = await User.findOne({ UserId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("❌ UPDATE PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    let { Name, Email, Password, Phone, Gender } = req.body;

    Name = Name?.trim();
    Email = Email?.trim().toLowerCase();

    if (!Name || !Email || !Password) {
      return res.status(400).json({ message: "Name, Email and Password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (Password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!Phone || !/^\+91[0-9]{10}$/.test(Phone)) {
      return res.status(400).json({ message: "Phone must be +91 followed by 10 digits" });
    }

    const existingUser = await User.findOne({ Email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({
      Name,
      Email,
      Password: hashedPassword,
      Phone,
      Gender,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    let { Email, Password } = req.body;

    Email = Email?.trim().toLowerCase();

    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({
      message: "Login successful",
      UserId: user.UserId,     
      Name: user.Name,
      Handle: user.Handle,
      Email: user.Email,
      Phone: user.Phone,
      Gender: user.Gender,
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ======================
// DELETE ACCOUNT
// ======================
router.delete("/delete/:UserId", async (req, res) => {
  try {
    const { UserId } = req.params;

    console.log("Deleting user with Userid:", userId);

    // ✅ FIXED: Delete using custom Userid field
    const deletedUser = await User.findOneAndDelete({
      UserId: userId,
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;