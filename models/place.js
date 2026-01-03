const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema({
  PlaceId: {
    type: String,
    required: true,
    unique: true
  },
  Name: {
    type: String,
    required: true
  },
  Location: {
    type: String,
    required: true
  },
  Type: {
    type: String,
    required: true
  },
  Description: {
    type: String
  }
});

module.exports = mongoose.model("Place", PlaceSchema);
