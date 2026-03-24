const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const GuideSchema = new mongoose.Schema({

  GuideId: { 
    type: String,
    unique: true,
  },

  PlaceId: {
    type: String,
    required: true,
    ref: "Place"
  },

  Name: {
    en: { type: String, required: true },
    hi: { type: String, required: true }
  },

  Location: {
    en: { type: String, required: true },
    hi: { type: String, required: true }
  },

  Languages: [
    {
      en: String,
      hi: String
    }
  ],

  Experience: {
    type: String,
    default: "0+"
  },

  Phone: String,
  Email: String,

  Photo: String,

  Rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  Availability: {
    type: Boolean,
    default: true
  }

});

GuideSchema.pre("save", async function () {
  if (!this.GuideId) {
    this.GuideId = await getNextSequence("GuideId", "G");
  }
});

module.exports = mongoose.model("Guide", GuideSchema);