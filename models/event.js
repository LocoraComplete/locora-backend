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
    type: String,
    required: true,
    maxlength: 50
  },

  Date: {
    type: Date,
    required: true
  },

  Description: {
    type: String
  }
});

module.exports = mongoose.model("Event", EventSchema);
