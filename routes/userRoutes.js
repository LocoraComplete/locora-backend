const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const upload = require("../middlewares/upload");

// ======================
// REGISTER
// ======================
// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    let { Name, Email, Password, Phone, Gender, emergencyContacts } = req.body;

    Name = Name?.trim();
    Email = Email?.trim().toLowerCase();

    if (!Name || !Email || !Password || !Phone) {
      return res.status(400).json({ message: "Name, Email, Password, and Phone are required" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone
    if (!/^\+91\d{10}$/.test(Phone)) {
      return res.status(400).json({ message: "Phone must be +91 followed by 10 digits" });
    }

    // Validate emergency contacts
    if (!emergencyContacts?.primary || !/^\d{10}$/.test(emergencyContacts.primary)) {
      return res.status(400).json({ message: "Primary emergency contact must be 10 digits" });
    }

    if (emergencyContacts.secondary && !/^\d{10}$/.test(emergencyContacts.secondary)) {
      return res.status(400).json({ message: "Secondary emergency contact must be 10 digits" });
    }

    // Format emergency contacts with +91
    const formatContact = (num) => "+91" + num.replace(/\D/g, "");
    const primaryContact = formatContact(emergencyContacts.primary);
    const secondaryContact = emergencyContacts.secondary ? formatContact(emergencyContacts.secondary) : "";

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({
      UserId: "U" + Date.now(),
      Name,
      Email,
      Password: hashedPassword,
      Phone, // already +91 from frontend
      Gender,
      emergencyContacts: {
        primary: primaryContact,
        secondary: secondaryContact,
      },
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

  res.status(200).json({
  message: "Login successful",
  UserId: user.UserId,
  Name: user.Name,
  Handle: user.Handle,
  Pronouns: user.Pronouns,
  Bio: user.Bio,
  profilePic: user.profilePic
    ? `${req.protocol}://${req.get("host")}${user.profilePic}`
    : null,
  emergencyContacts: user.emergencyContacts || { primary: "", secondary: "" },
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

    const deletedUser = await User.findOneAndDelete({ UserId });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

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

    const updateData = {
      Name: name,
      Handle: username,
      Pronouns: pronouns,
      Bio: bio,
    };

    if (req.file) {
      updateData.profilePic = `/uploads/${req.file.filename}`;
      //updateData.profilePic = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`; //`/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findOneAndUpdate(
      { UserId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

   res.status(200).json({
  message: "Profile updated successfully",
  UserId: updatedUser.UserId,
  Name: updatedUser.Name,
  Handle: updatedUser.Handle,
  Pronouns: updatedUser.Pronouns,
  Bio: updatedUser.Bio,
  profilePic: updatedUser.profilePic
    ? `${req.protocol}://${req.get("host")}${updatedUser.profilePic}`
    : null,
  emergencyContacts: updatedUser.emergencyContacts || { primary: "", secondary: "" },
});

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ======================
// GET USER BY ID
// ======================
router.get("/:UserId", async (req, res) => {

  try {

    const user = await User.findOne({ UserId: req.params.UserId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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