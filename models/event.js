const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  EventId: {
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

  Date: {
    type: Date,
    required: true
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

module.exports = mongoose.model("Event", EventSchema);