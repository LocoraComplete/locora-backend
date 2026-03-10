const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const upload = require("../middlewares/upload");
const path = require("path");

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    let { Name, Email, Password, Phone, Gender, emergencyContact } = req.body;

    Name = Name?.trim();
    Email = Email?.trim().toLowerCase();

    // Basic validations
    if (!Name || !Email || !Password || !Phone || !emergencyContact) {
      return res.status(400).json({ message: "Name, Email, Password, Phone, and Primary Emergency Contact are required" });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) return res.status(400).json({ message: "Invalid email format" });

    // Phone format
    const phoneDigits = Phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) return res.status(400).json({ message: "Phone must be 10 digits" });
    Phone = "+91" + phoneDigits;

    // Emergency contact format
    const emergencyDigits = emergencyContact.replace(/\D/g, "");
    if (emergencyDigits.length !== 10) {
      return res.status(400).json({ message: "Primary emergency contact must be 10 digits" });
    }
    const formattedEmergency = "+91" + emergencyDigits;

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Create new user
    const newUser = new User({
      UserId: "U" + Date.now(),
      Name,
      Email,
      Password: hashedPassword,
      Phone,
      Gender,
      emergencyContact: formattedEmergency,
      profileCompleted: false,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) return res.status(400).json({ message: "Email and Password are required" });

    const user = await User.findOne({ Email });
    if (user && user.isDeleted) {
      return res.status(403).json({ message: "This account no longer exists" });
    }
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    return res.status(200).json({
      message: "Login successful",
      UserId: user.UserId,
      Name: user.Name,
      Handle: user.Handle,
      Pronouns: user.Pronouns,
      Bio: user.Bio,
      profilePic: user.profilePic
        ? `${req.protocol}://${req.get("host")}${user.profilePic}`
        : null,
      emergencyContact: user.emergencyContact || "",
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// DELETE ACCOUNT
// ======================
router.delete("/delete/:UserId", async (req, res) => {
  try {
    const { UserId } = req.params;

    const user = await User.findOne({ UserId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    user.Name = "Deleted User";
    user.Handle = `deleted_${Date.now()}`;
    user.profilePic = "";
    user.Bio = "";
    user.Pronouns = "";

    await user.save();

    res.status(200).json({ message: "Account deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// UPLOAD PROFILE PIC
// ======================
router.post("/upload-profile/:UserId", upload.single("profilePic"), async (req, res) => {
  try {
    const { UserId } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const updatedUser = await User.findOneAndUpdate(
      { UserId },
      { $set: { profilePic: `/uploads/${req.file.filename}` } },
      { new: true }
    );

    res.status(200).json({
      message: "Profile picture updated",
      profilePic: `${req.protocol}://${req.get("host")}${updatedUser.profilePic}`,
    });
  } catch (error) {
    console.error("UPLOAD PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// UPDATE PROFILE
// ======================
router.put("/update-profile/:UserId", upload.single("profilePic"), async (req, res) => {
  try {
    const { UserId } = req.params;
    const { name, username, pronouns, bio } = req.body;

    const updateData = { Name: name, Handle: username, Pronouns: pronouns, Bio: bio };
    if (req.file) updateData.profilePic = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findOneAndUpdate({ UserId }, { $set: updateData }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile updated successfully",
      UserId: updatedUser.UserId,
      Name: updatedUser.Name,
      Handle: updatedUser.Handle,
      Pronouns: updatedUser.Pronouns,
      Bio: updatedUser.Bio,
      profilePic: updatedUser.profilePic ? `${req.protocol}://${req.get("host")}${updatedUser.profilePic}` : null,
      emergencyContact: updatedUser.emergencyContact || "",
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// CHECK PASSWORD
// ======================
router.post("/check-password", async (req, res) => {
  try {
    const { userId, oldPassword } = req.body;
    if (!userId || !oldPassword) return res.status(400).json({ valid: false, message: "userId and oldPassword required" });

    const user = await User.findOne({ UserId: userId });
    if (!user) return res.status(404).json({ valid: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    res.status(200).json({ valid: isMatch, message: isMatch ? "Password correct" : "Old password incorrect" });
  } catch (err) {
    console.error("CHECK PASSWORD ERROR:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

// ======================
// UPDATE PASSWORD
// ======================
// UPDATE PASSWORD (POST version)
router.post("/update-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "userId, oldPassword, newPassword required" });

    if (oldPassword.length < 6 || newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Passwords must be at least 6 chars" });

    if (oldPassword === newPassword)
      return res.status(400).json({ success: false, message: "New password cannot match old password" });

    const user = await User.findOne({ UserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Old password incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ UserId: userId }, { $set: { Password: hashedPassword } });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("UPDATE PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ======================
// UPDATE EMERGENCY CONTACT
// ======================
router.put("/:UserId/update-emergency", async (req, res) => {
  try {
    const { UserId } = req.params;
    const { emergencyContact } = req.body;

    if (!emergencyContact || !/^\+91\d{10}$/.test(emergencyContact)) {
      return res.status(400).json({
        success: false,
        message: "Emergency contact must be +91 followed by 10 digits",
      });
    }

    const user = await User.findOne({ UserId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.emergencyContact = emergencyContact;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully",
    });

  } catch (error) {
    console.error("EMERGENCY CONTACT UPDATE ERROR:", error);
    res.status(500).json({ success: false });
  }
});

// ======================
router.get("/:UserId", async (req, res) => {
  try {
    const user = await User.findOne({ UserId: req.params.UserId });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      UserId: user.UserId,
      Name: user.Name,
      Handle: user.Handle,
      Bio: user.Bio,
      Pronouns: user.Pronouns,
      profilePic: user.profilePic
        ? `${req.protocol}://${req.get("host")}${user.profilePic}`
        : null,
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;