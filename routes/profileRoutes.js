const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");

// CREATE PROFILE
router.post("/create", async (req, res) => {
  try {
    const { UserId, Bio, Interests, ProfilePic } = req.body;

    // check if user exists
    const user = await User.findOne({ UserId });
    if (!user) {
      return res.status(404).json({ message: "UserId does not exist" });
    }

    // prevent duplicate profile for same user
    const existingProfile = await Profile.findOne({ UserId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this user" });
    }

    // ---------- AUTO GENERATE PROFILE ID ----------
    // get latest profile by numeric value, not string sort
    const lastProfile = await Profile
    .findOne({ ProfileId: { $regex: /^P\d+$/ } })
    .sort({ ProfileId: -1 });   // 👈 sort by ProfileId itself

    let newProfileId = "P001";

    if (lastProfile && lastProfile.ProfileId) {
        const num = parseInt(lastProfile.ProfileId.slice(1), 10);

    if (!isNaN(num)) {
        newProfileId = `P${num + 1}`;
    }
}

    // create profile
    const newProfile = new Profile({
      ProfileId: newProfileId,
      UserId,
      Bio,
      Interests,
      ProfilePic
    });

    await newProfile.save();

    return res.status(201).json({
      message: "Profile created successfully",
      profile: newProfile
    });

  } catch (error) {
    console.error("PROFILE CREATE ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
