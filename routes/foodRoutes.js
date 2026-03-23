const express = require("express");
const router = express.Router();
const Food = require("../models/food");
const Place = require("../models/place");
const getNextSequence = require("../utils/generateId"); // ✅ IMPORTANT

// GET ALL FOOD
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "en";

    const food = await Food.find();

    const formatted = food.map(item => ({
      FoodId: item.FoodId,
      PlaceId: item.PlaceId,
      Name: item.Name?.[lang] || item.Name?.en,
      Type: item.Type,
      PriceRange: item.PriceRange,
      Description: item.Description?.[lang] || item.Description?.en,
      ImageURL: item.ImageURL
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE FOOD
router.post("/create", async (req, res) => {
  try {
    const { PlaceId, Name, Type, PriceRange, Description, ImageURL } = req.body;

    //  VALIDATION
    if (!PlaceId || !Name?.en || !Name?.hi || !Type || !ImageURL) {
      return res.status(400).json({
        message: "PlaceId, Name (both languages), Type and ImageURL are required"
      });
    }

    //  CHECK PLACE EXISTS
    const placeExists = await Place.findOne({ PlaceId });
    if (!placeExists) {
      return res.status(404).json({
        message: "PlaceId does not exist"
      });
    }

    //  USE COUNTER 
    const newFoodId = await getNextSequence("FoodId", "FD");

    const newFood = new Food({
      FoodId: newFoodId,
      PlaceId,
      Name,
      Type,
      PriceRange,
      Description,
      ImageURL
    });

    await newFood.save();

    res.status(201).json({
      message: "Food added successfully",
      food: newFood
    });

  } catch (error) {
    console.error("FOOD CREATE ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;