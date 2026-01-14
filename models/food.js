const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  FoodId: {
    type: String,
    unique: true,
    required: true
  },

  PlaceId: {
    type: String,
    required: true,
    ref: "Place"
  },

  Name: {
    type: String,
    required: true,
    maxlength: 50
  },

  Type: {
    type: String,
    enum: ["Veg", "Non-Veg", "Dessert", "Snack", "Drink"],
    required: true
  },

  PriceRange: {
    type: String
  },

  Description: {
    type: String
  },

  ImageURL: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Food", FoodSchema);
