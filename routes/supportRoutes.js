const express = require("express");
const router = express.Router();
const SupportRequest = require("../models/supportrequest");

// CREATE SUPPORT REQUEST
router.post("/create", async (req, res) => {
  try {
    const { email, issue, userId } = req.body;

    if (!email || !issue) {
      return res.status(400).json({ message: "Email and issue are required" });
    }

    const supportRequest = new SupportRequest({
      email,
      issue,
      userId,
    });

    await supportRequest.save();

    res.status(201).json({
      message: "Support request submitted successfully",
      supportRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;