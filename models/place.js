const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema({
  PlaceId: {
    type: String,
    required: true,
    unique: true
  },

  Name: {
    en: { type: String, required: true },
    hi: { type: String, required: true }
  },

  Location: {
    en: { type: String, required: true },
    hi: { type: String, required: true }
  },

  Type: {
    en: { type: String, required: true },
    hi: { type: String, required: true }
  },

  Description: {
    en: { type: String },
    hi: { type: String }
  },

  ImageURL: {
    type: String
  }

});

module.exports = mongoose.model("Place", PlaceSchema);