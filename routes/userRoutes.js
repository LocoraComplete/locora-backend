const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { upload, deleteFromCloudinary } = require("../config/cloudinary");

const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const sendOTPEmail = require("../utils/sendEmail"); 

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    let { Name, Email, Password, Phone, Gender, emergencyContact } = req.body;

    Name = Name?.trim();
    Email = Email?.trim().toLowerCase();

    if (!Name || !Email || !Password || !Phone || !emergencyContact) {
      return res.status(400).json({ message: "Name, Email, Password, Phone, and Primary Emergency Contact are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const phoneDigits = Phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }
    Phone = "+91" + phoneDigits;

    const emergencyDigits = emergencyContact.replace(/\D/g, "");
    if (emergencyDigits.length !== 10) {
      return res.status(400).json({ message: "Primary emergency contact must be 10 digits" });
    }
    const formattedEmergency = "+91" + emergencyDigits;

    const hashedPassword = await bcrypt.hash(Password, 10);

    // GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      UserId: "U" + Date.now(),
      Name,
      Email,
      Password: hashedPassword,
      Phone,
      Gender,
      emergencyContact: formattedEmergency,
      profileCompleted: false,
      isVerified: false,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 min
    });

    await newUser.save();

    // SEND EMAIL
    await sendOTPEmail(Email, otp);

    res.status(201).json({
      message: "OTP sent to email",
      email: Email,
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "Email") {
        return res.status(400).json({
          message: "This email is already registered",
        });
      }

      if (duplicateField === "Phone") {
        return res.status(400).json({
          message: "This phone number is already registered",
        });
      }

      return res.status(400).json({
        message: "This account already exists",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});


// ======================
// VERIFY OTP
// ======================
router.post("/verify-otp", async (req, res) => {
  try {
    const { Email, otp } = req.body;

    const user = await User.findOne({ Email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ======================
// RESEND OTP
// ======================
router.post("/resend-otp", async (req, res) => {
  try {
    const { Email } = req.body;

    const user = await User.findOne({ Email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendOTPEmail(Email, otp);

    res.json({ message: "OTP resent successfully" });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
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

    if (user && user.isDeleted) {
      return res.status(403).json({ message: "This account no longer exists" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // BLOCK LOGIN IF NOT VERIFIED
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
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
      Pronouns: user.Pronouns,
      Bio: user.Bio,
      profilePic: user.profilePic || null,
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


    // ================= DELETE USER POSTS + IMAGES =================
    const posts = await Post.find({ UserId });

    for (const post of posts) {
      for (const url of post.ImageIds) {
        await deleteFromCloudinary(url);
      }
    }
    await Post.deleteMany({ UserId });

    // ================= REMOVE USER LIKES =================
    await Post.updateMany(
      { likes: UserId },
      { $pull: { likes: UserId } }
    );


    // ================= REMOVE USER COMMENTS =================
    await Post.updateMany(
      { "comments.UserId": UserId },
      { $pull: { comments: { UserId } } }
    );


    // ================= DELETE USER MESSAGES =================
    await Message.deleteMany({ SenderId: UserId });


    // ================= HANDLE CHATS =================
    const chats = await Chat.find({ Members: UserId });

    for (const chat of chats) {

      if (chat.ChatType === "private") {

        await Message.deleteMany({ ChatId: chat.ChatId });
        await Chat.deleteOne({ ChatId: chat.ChatId });

      } else {

        chat.Members = chat.Members.filter(id => id !== UserId);
        await chat.save();

      }

    }


    // ================= DELETE USER =================
    await User.deleteOne({ UserId });


    res.json({
      message: "Account and all associated data permanently deleted"
    });

  } catch (error) {

    console.error("ACCOUNT DELETE ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
});


// ======================
// UPLOAD PROFILE PIC
// ======================
router.post("/upload-profile/:UserId", upload.single("profilePic"), async (req, res) => {
  try {

    const { UserId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { UserId },
      { $set: { profilePic: req.file.path } },
      { new: true }
    );

    res.status(200).json({
      message: "Profile picture updated",
      profilePic: updatedUser.profilePic,
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

    const existingUser = await User.findOne({ UserId });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.file && existingUser.profilePic) {
      await deleteFromCloudinary(existingUser.profilePic);
    }

    const updateData = {
      Name: name,
      Handle: username,
      Pronouns: pronouns,
      Bio: bio
    };

    if (req.file) {
      updateData.profilePic = req.file.path;
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
      profilePic: updatedUser.profilePic || null,
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

    if (!userId || !oldPassword) {
      return res.status(400).json({ valid: false, message: "userId and oldPassword required" });
    }

    const user = await User.findOne({ UserId: userId });

    if (!user) {
      return res.status(404).json({ valid: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.Password);

    res.status(200).json({
      valid: isMatch,
      message: isMatch ? "Password correct" : "Old password incorrect"
    });

  } catch (err) {

    console.error("CHECK PASSWORD ERROR:", err);
    res.status(500).json({ valid: false, message: "Server error" });

  }
});


// ======================
// UPDATE PASSWORD
// ======================
router.post("/update-password", async (req, res) => {
  try {

    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "userId, oldPassword, newPassword required" });
    }

    if (oldPassword.length < 6 || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Passwords must be at least 6 chars" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password cannot match old password" });
    }

    const user = await User.findOne({ UserId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.Password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { UserId: userId },
      { $set: { Password: hashedPassword } }
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

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
        message: "Emergency contact must be +91 followed by 10 digits"
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
      message: "Emergency contact updated successfully"
    });

  } catch (error) {

    console.error("EMERGENCY CONTACT UPDATE ERROR:", error);
    res.status(500).json({ success: false });

  }
});


// ======================
// GET USER
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
      profilePic: user.profilePic || null,
    });

  } catch (error) {

    console.error("GET USER ERROR:", error);
    res.status(500).json({ message: "Server error" });

  }
});

// ================= SEARCH USERS =================
router.get("/search/all", async (req, res) => {
  try {
    const { query, currentUserId } = req.query;

    if (!query) return res.json([]);

    const users = await User.find({
      UserId: { $ne: currentUserId },
      $or: [
        { Name: { $regex: query, $options: "i" } },
        { Handle: { $regex: query, $options: "i" } },
      ],
    })
      .select("UserId Handle profilePic")
      .limit(20);

    res.json(users);

  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;