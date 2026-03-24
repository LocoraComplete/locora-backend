const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const upload = require("../middlewares/upload");
const path = require("path");
const fs = require("fs");

const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const sendEmail = require("../sendEmail"); // adjust path
const pendingUsers = new Map();
// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  console.log("REGISTER ROUTE HIT");
  console.log("BODY:", req.body);
  try {

    let { Name, Email, Password, Phone, Gender, emergencyContact } = req.body;

    Name = Name?.trim();
    Email = Email?.trim().toLowerCase();

    if (!Name || !Email || !Password || !Phone || !emergencyContact) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      UserId: "U" + Date.now(),
      Name,
      Email,
      Password: hashedPassword,
      Phone: "+91" + Phone.replace(/\D/g, ""),
      Gender,
      emergencyContact: "+91" + emergencyContact.replace(/\D/g, ""),
      isVerified: false,
      emailOTP: otp,
      otpExpires,
    });

    //await newUser.save();
    // store user temporarily
pendingUsers.set(Email, {
  Name,
  Email,
  Password: hashedPassword,
  Phone: "+91" + Phone.replace(/\D/g, ""),
  Gender,
  emergencyContact: "+91" + emergencyContact.replace(/\D/g, ""),
  otp,
  otpExpires
});
    console.log("Sending OTP email to:", Email);

    await sendEmail(
      Email,
      "LOCORA Email Verification",
      `<h2>LOCORA Email Verification</h2>
       <p>Your verification code is:</p>
       <h1 style="letter-spacing:5px">${otp}</h1>
       <p>This code expires in 10 minutes.</p>
       <p>If you did not request this, ignore this email.</p>`
    );

    console.log("OTP email sent successfully to", Email);

    return res.status(201).json({
      message: "OTP sent. Verify your email."
    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Server error during registration"
    });

  }
});
// ======================
// VERIFY EMAIL
// ======================
router.post("/verify-email", async (req, res) => {
  try {

    const { Email, otp } = req.body;

    const pendingUser = pendingUsers.get(Email.toLowerCase());

    if (!pendingUser) {
      return res.status(400).json({ message: "No signup request found" });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (pendingUser.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // CREATE USER AFTER VERIFICATION
    const newUser = new User({
      UserId: "U" + Date.now(),
      Name: pendingUser.Name,
      Email: pendingUser.Email,
      Password: pendingUser.Password,
      Phone: pendingUser.Phone,
      Gender: pendingUser.Gender,
      emergencyContact: pendingUser.emergencyContact,
      isVerified: true
    });

    await newUser.save();

    // remove temporary data
    pendingUsers.delete(Email.toLowerCase());

    res.json({ message: "Email verified and account created" });

  } catch (error) {

    console.error("VERIFY EMAIL ERROR:", error);

    res.status(500).json({ message: "Server error" });

  }
});

// ======================
// RESEND OTP
// ======================
router.post("/resend-otp", async (req, res) => {
  try {
    const { Email } = req.body;
    const user = await User.findOne({ Email: Email.toLowerCase() });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(
      Email,
      "LOCORA OTP Resent",
      `<h2>Your new OTP is:</h2><h1>${otp}</h1><p>Expires in 10 minutes.</p>`
    );

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
      return res.status(400).json({
        message: "Email and Password are required"
      });
    }

    const user = await User.findOne({ Email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in"
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        message: "This account no longer exists"
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


    // ================= DELETE USER POSTS + IMAGES =================
    const posts = await Post.find({ UserId });

    for (const post of posts) {

      if (post.ImageId) {

        const filePath = path.join(__dirname, "../uploads", post.ImageId);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

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
      Bio: bio
    };

    if (req.file) {
      updateData.profilePic = `/uploads/${req.file.filename}`;
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
