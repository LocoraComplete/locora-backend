const express = require("express");
const router = express.Router();
const Guide = require("../models/Guide");
const User = require("../models/User");

// CREATE GUIDE
router.post("/create", async (req, res) => {
  try {

    const {
      PlaceId,
      Name,
      Location,
      Languages,
      Experience,
      Phone,
      Email,
      Photo,
      Availability
    } = req.body;

    if (!PlaceId) {
      return res.status(400).json({ message: "PlaceId required" });
    }

    const newGuide = new Guide({
      PlaceId,
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

    const { lang = "en", PlaceId } = req.query;

    const filter = {
      Availability: true
    };

    if (PlaceId) {
      filter.PlaceId = PlaceId;
    }

    const guides = await Guide.find(filter);

    const formatted = guides.map((g) => ({
      id: g.GuideId,
      name: g.Name[lang],
      location: g.Location[lang],
      languages: g.Languages.map((l) => l[lang]),
      experience: g.Experience,
      rating: g.Rating,
      userRatingAverage: g.userRatingAverage,
      totalReviews: g.totalUserReviews,
      phone: g.Phone,
      email: g.Email,
      photo: g.Photo,
    }));

    res.json(formatted);

  } catch (error) {
    console.error("GUIDE FETCH ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// RATE GUIDE
router.post("/rate", async (req, res) => {
  try {
    const { GuideId, UserId, rating } = req.body;

    if (!GuideId || !UserId || !rating) {
      return res.status(400).json({ message: "GuideId, UserId and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1-5" });
    }

    const guide = await Guide.findOne({ GuideId });

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    const existingRating = guide.userRatings.find(
      (r) => r.UserId === UserId
    );

    if (existingRating) {
      guide.totalUserRating -= existingRating.rating;
      existingRating.rating = rating;
    } else {
      guide.userRatings.push({ UserId, rating });
      guide.totalUserReviews += 1;
    }

    guide.totalUserRating += rating;
    guide.userRatingAverage =
      guide.totalUserRating / guide.totalUserReviews;

    await guide.save();

    res.json({
      message: "Rating submitted",
      averageRating: guide.userRatingAverage.toFixed(1),
      totalReviews: guide.totalUserReviews,
    });
  } catch (error) {
    console.error("GUIDE RATING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER RATING FOR A GUIDE
router.get("/user-rating", async (req, res) => {
  try {
    const { GuideId, UserId } = req.query;

    if (!GuideId || !UserId) {
      return res.status(400).json({
        message: "GuideId and UserId required",
      });
    }

    const guide = await Guide.findOne({ GuideId });

    if (!guide) {
      return res.status(404).json({
        message: "Guide not found",
      });
    }

    const existingRating = guide.userRatings.find(
      (r) => r.UserId === UserId
    );

    res.json({
      rating: existingRating ? existingRating.rating : 0,
    });
  } catch (error) {
    console.error("USER RATING FETCH ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
