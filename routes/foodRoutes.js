const express = require("express");
const router = express.Router();
const Food = require("../models/food");
const Place = require("../models/place");

// GET ALL FOOD
router.get("/", async (req, res) => {
  try {
    const food = await Food.find();
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE FOOD
router.post("/create", async (req, res) => {
  try {
    const { PlaceId, Name, Type, PriceRange, Description, ImageURL } = req.body;

    if (!PlaceId || !Name || !Type || !ImageURL) {
      return res.status(400).json({
        message: "PlaceId, Name, Type and ImageURL are required"
      });
    }

    const placeExists = await Place.findOne({ PlaceId });
    if (!placeExists) {
      return res.status(404).json({
        message: "PlaceId does not exist"
      });
    }

    // AUTO FOOD ID
    const lastFood = await Food
      .findOne({ FoodId: { $regex: /^FD\d+$/ } })
      .sort({ FoodId: -1 });

    let newFoodId = "FD001";

    if (lastFood?.FoodId) {
      const lastNum = parseInt(lastFood.FoodId.slice(2), 10);
      if (!isNaN(lastNum)) newFoodId = `FD${lastNum + 1}`;
    }

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
