const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const Place = require("../models/place");

/**
 * GET ALL EVENTS  
 */
router.get("/", async (req, res) => {
  try {

    const lang = req.query.lang || "en";

    const events = await Event.find();

    const formatted = events.map(event => ({
      EventId: event.EventId,
      PlaceId: event.PlaceId,
      Name: event.Name?.[lang] || event.Name?.en,
      Date: event.Date,
      Description: event.Description?.[lang] || event.Description?.en,
      ImageURL: event.ImageURL
    }));

    res.status(200).json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE EVENT
router.post("/create", async (req, res) => {
  try {
    const { PlaceId, Name, Date, Description, ImageURL } = req.body;

    if (!PlaceId || !Name?.en || !Name?.hi || !Date) {
      return res.status(400).json({
        message: "PlaceId, Name (both languages) and Date are required",
      });
    }

    const place = await Place.findOne({ PlaceId });
    if (!place) {
      return res.status(404).json({
        message: "PlaceId does not exist",
      });
    }

    const lastEvent = await Event.findOne({
      EventId: { $regex: /^E\d+$/ },
    }).sort({ EventId: -1 });

    let newEventId = "E5001";
    if (lastEvent?.EventId) {
      const lastNum = parseInt(lastEvent.EventId.slice(1), 10);
      if (!isNaN(lastNum)) newEventId = `E${lastNum + 1}`;
    }

    const newEvent = new Event({
      EventId: newEventId,
      PlaceId,
      Name,
      Date,
      Description,
      ImageURL
    });

    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("EVENT CREATE ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
