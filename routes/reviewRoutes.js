const express = require("express");
const router = express.Router();

const Review = require("../models/Review");
const User = require("../models/User");

// ---------- CREATE REVIEW ----------
router.post("/create", async (req, res) => {
  try {
    const { UserId, PlaceId, Rating, Comment, Date } = req.body;

    // Check valid user
    const user = await User.findOne({ UserId });
    if (!user) {
      return res.status(404).json({ message: "UserId does not exist" });
    }

    // Prevent duplicate review by same user for same place
    const existingReview = await Review.findOne({ UserId, PlaceId });
    if (existingReview) {
      return res.status(400).json({
        message: "User has already reviewed this place"
      });
    }

    // Validate rating manually 
    if (Rating < 1 || Rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const newReview = new Review({
      UserId,
      PlaceId,
      Rating,
      Comment,
      Date
    });

    await newReview.save();

    return res.status(201).json({
      message: "Review submitted successfully",
      review: newReview
    });

  } catch (error) {
    console.error("REVIEW CREATE ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ---------- GET REVIEWS FOR A PLACE ----------
router.get("/place/:PlaceId", async (req, res) => {
  try {
    const reviews = await Review.find({ PlaceId: req.params.PlaceId });

    return res.status(200).json({
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("FETCH REVIEWS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// ---------- GET REVIEWS BY USER ----------
router.get("/user/:UserId", async (req, res) => {
  try {
    const reviews = await Review.find({ UserId: req.params.UserId });

    return res.status(200).json({
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("FETCH USER REVIEWS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
