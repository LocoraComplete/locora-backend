const express = require("express");
const router = express.Router();
const Guide = require("../models/Guide");
const User = require("../models/User");

// CREATE GUIDE
router.post("/create", async (req, res) => {
  try {

    const {
      UserId,
      Name,
      Location,
      Languages,
      Experience,
      Phone,
      Email,
      Photo,
      Availability
    } = req.body;

    const user = await User.findOne({ UserId });

    if (!user) {
      return res.status(404).json({ message: "UserId does not exist" });
    }

    const existingGuide = await Guide.findOne({ UserId });

    if (existingGuide) {
      return res.status(400).json({
        message: "This user is already registered as a guide"
      });
    }

    const newGuide = new Guide({
      UserId,
      Name,
      Location,
      Languages,
      Experience,
      Phone,
      Email,
      Photo,
      Availability: Availability ?? true
    });

    await newGuide.save();

    res.status(201).json({
      message: "Guide registered successfully",
      guide: newGuide
    });

  } catch (error) {
    console.error("GUIDE CREATE ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// GET ALL GUIDES
router.get("/all", async (req, res) => {

  try {

    const { lang = "en" } = req.query;

    const guides = await Guide.find({ Availability: true });

    const formatted = guides.map(g => ({
      id: g.GuideId,
      name: g.Name[lang],
      location: g.Location[lang],
      languages: g.Languages.map(l => l[lang]),
      experience: g.Experience,
      rating: g.Rating,
      phone: g.Phone,
      email: g.Email,
      photo: g.Photo
    }));

    res.json(formatted);

  } catch (error) {

    console.error("GUIDE FETCH ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }

});

module.exports = router;
