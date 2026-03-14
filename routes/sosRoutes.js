const express = require("express");
const router = express.Router();
const SOSAlert = require("../models/SOSAlert");
const User = require("../models/User");

// Create SOS alert
router.post("/raise-alert", async (req, res) => {
  try {
    console.log("Incoming SOS:", req.body);
    const { UserId, Latitude, Longitude } = req.body;

    // Validate user exists
    const user = await User.findOne({ UserId });

    if (!user) {
      console.log("User not found:", UserId);
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
    console.log("SOS SAVED:", newAlert);

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
