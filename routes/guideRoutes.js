const express = require("express");
const router = express.Router();
const Guide = require("../models/Guide");
const User = require("../models/User");

// CREATE GUIDE
router.post("/create", async (req, res) => {
  try {
    const { UserId, Location, Availability } = req.body;

    // check if user exists
    const user = await User.findOne({ UserId });
    if (!user) {
      return res.status(404).json({ message: "UserId does not exist" });
    }

    // prevent duplicate guide registration
    const existingGuide = await Guide.findOne({ UserId });
    if (existingGuide) {
      return res.status(400).json({
        message: "This user is already registered as a guide"
      });
    }

    // ---------- AUTO GENERATE GUIDE ID ----------
    const lastGuide = await Guide
      .findOne({ GuideId: { $regex: /^G\d+$/ } })
      .sort({ GuideId: -1 });

    let newGuideId = "G001";

    if (lastGuide?.GuideId) {
      const lastNum = parseInt(lastGuide.GuideId.slice(1), 10);
      if (!isNaN(lastNum)) newGuideId = `G${lastNum + 1}`;
    }

    // create guide entry
    const newGuide = new Guide({
      GuideId: newGuideId,
      UserId,
      Location,
      Availability: Availability ?? true,
      Rating: 0
    });

    await newGuide.save();

    return res.status(201).json({
      message: "Guide registered successfully",
      guide: newGuide
    });

  } catch (error) {
    console.error("GUIDE CREATE ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;
