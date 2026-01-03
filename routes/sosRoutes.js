const express = require("express");
const router = express.Router();
const SOSAlert = require("../models/SOSAlert");
const User = require("../models/User");

// Create SOS alert
router.post("/raise-alert", async (req, res) => {
  try {
    const { UserId, Latitude, Longitude } = req.body;

    // Validate user exists
    const user = await User.findOne({ UserId });

    if (!user) {
      return res.status(400).json({
        message: "Invalid UserId — User does not exist"
      });
    }

    const newAlert = new SOSAlert({
      UserId,
      Latitude,
      Longitude
    });

    await newAlert.save();

    res.status(201).json({
      message: "SOS Alert Raised Successfully",
      alert: newAlert
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
