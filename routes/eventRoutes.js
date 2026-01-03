const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const Place = require("../models/place");

// CREATE EVENT
router.post("/create", async (req, res) => {
  try {
    const { PlaceId, Name, Date, Description } = req.body;

    // validation
    if (!PlaceId || !Name || !Date) {
      return res.status(400).json({
        message: "PlaceId, Name and Date are required"
      });
    }

    // check if place exists
    const place = await Place.findOne({ PlaceId });
    if (!place) {
      return res.status(404).json({
        message: "PlaceId does not exist"
      });
    }

    // ---------- AUTO GENERATE EVENT ID ----------
    const lastEvent = await Event
      .findOne({ EventId: { $regex: /^E\d+$/ } })
      .sort({ EventId: -1 });

    let newEventId = "E5001";

    if (lastEvent?.EventId) {
      const lastNum = parseInt(lastEvent.EventId.slice(1), 10);
      if (!isNaN(lastNum)) newEventId = `E${lastNum + 1}`;
    }

    // create event
    const newEvent = new Event({
      EventId: newEventId,
      PlaceId,
      Name,
      Date,
      Description
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    console.error("EVENT CREATE ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;
