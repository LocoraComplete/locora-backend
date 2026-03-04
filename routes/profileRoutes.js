const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");

// CREATE OR UPDATE PROFILE WITH EMERGENCY CONTACTS
router.post("/create", async (req, res) => {
  try {
    const { UserId, Bio, Interests, ProfilePic, emergencyContacts, Name, Location } = req.body;

    // check if user exists
    const user = await User.findOne({ UserId });
    if (!user) {
      return res.status(404).json({ message: "UserId does not exist" });
    }

    // Validate primary emergency
    if (!emergencyContacts || !emergencyContacts.primary) {
      return res.status(400).json({ message: "Primary emergency contact is required" });
    }

    // prevent duplicate profile for same user
    let profile = await Profile.findOne({ UserId });
    if (!profile) {
      // create profile 
      profile = new Profile({
        UserId,
        Bio,
        Interests,
        ProfilePic,
      });

      await profile.save();
    } else {
      // update profile if exists
      profile.Bio = Bio || profile.Bio;
      profile.Interests = Interests || profile.Interests;
      profile.ProfilePic = ProfilePic || profile.ProfilePic;
      await profile.save();
    }

    // update user document with emergency contacts, Name, Location, profileCompleted
    user.emergencyContacts = {
      primary: emergencyContacts.primary,
      secondary: emergencyContacts.secondary || undefined,
    };
    if (Name) user.Name = Name;
    if (Location) user.Location = Location;
    user.profileCompleted = true;

    await user.save();

    return res.status(200).json({
      message: "Profile setup completed successfully",
      profile,
      user,
    });

  } catch (error) {
    console.error("PROFILE CREATE/UPDATE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;