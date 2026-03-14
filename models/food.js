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
    en: { type: String, required: true, maxlength: 50 },
    hi: { type: String, required: true, maxlength: 50 }
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
    en: { type: String },
    hi: { type: String }
  },

  ImageURL: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Food", FoodSchema);