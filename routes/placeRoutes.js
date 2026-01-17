
const express = require("express");
const router = express.Router();
const Place = require("../models/place");

/**
 * CREATE PLACE
 */
router.post("/create", async (req, res) => {
  try {
    const { Name, Location, Type, Description, ImageURL } = req.body;

    if (!Name || !Location || !Type) {
      return res.status(400).json({
        message: "Name, Location and Type are required",
      });
    }

    const lastPlace = await Place.findOne({
      PlaceId: { $regex: /^PL\d+$/ },
    }).sort({ PlaceId: -1 });

    let newPlaceId = "PL4001";
    if (lastPlace?.PlaceId) {
      const lastNum = parseInt(lastPlace.PlaceId.slice(2));
      newPlaceId = `PL${lastNum + 1}`;
    }

    const newPlace = new Place({
      PlaceId: newPlaceId,
      Name,
      Location,
      Type,
      Description,
      ImageURL,
    });

    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET ALL PLACES  
 */
router.get("/", async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET PLACE BY ID
 */
router.get("/:placeId", async (req, res) => {
  try {
    const place = await Place.findOne({ PlaceId: req.params.placeId });
    if (!place) return res.status(404).json({ message: "Not found" });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
