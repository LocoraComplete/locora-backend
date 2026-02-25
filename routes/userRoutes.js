const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

/*router.post("/register", async (req, res) => {
  console.log("🔥 REGISTER HIT:", req.body);

  const { Name, Email, Password, Phone, Gender } = req.body;

  if (!Name || !Email || !Password) {
    return res.status(400).json({ message: "Name, Email and Password are required" });
  }

  try {
    const existingUser = await User.findOne({ Email: Email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });
      // 🔑 create handle from name
    const Handle = "@" + Name.replace(/\s+/g, "").toLowerCase();
    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({
      Name,
      Email: Email.toLowerCase(),
      Password: hashedPassword,
      Phone: Phone || null,
      Gender: Gender || "Other",
    });

    await newUser.save(); // ✅ actually saves to MongoDB
    console.log("✅ User saved in DB:", newUser);

    res.status(201).json({
      message: "User created",
      Name: newUser.Name,
      Email: newUser.Email,
    });
  } catch (err) {
    console.error("❌ Error saving user:", err);
    res.status(500).json({ message: "Server error" });
  }
});*/
router.post("/register", async (req, res) => {
  const { Name, Email, Password, Phone, Gender } = req.body;

  if (!Name || !Email || !Password) {
    return res.status(400).json({ message: "Name, Email and Password are required" });
  }

  const existingUser = await User.findOne({ Email: Email.toLowerCase() });
  if (existingUser) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(Password, 10);

  const newUser = new User({
    Name,
    Email: Email.toLowerCase(),
    Password: hashedPassword,
    Phone,
    Gender,
  });

  await newUser.save();

  res.status(201).json({ message: "User created" });
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    console.log("🔥 LOGIN HIT:", req.body);

    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    const emailLower = Email.toLowerCase();

    const user = await User.findOne({ Email: emailLower });
    console.log("👤 Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    console.log("🔐 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      UserId: user._id,
      Name: user.Name,
      Handle:user.Handle,
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
router.delete("/delete/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

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