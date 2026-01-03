const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const GuideSchema = new mongoose.Schema({

  GuideId: { 
    type: String,
    unique: true,
  },

  UserId: {
    type: String,
    required: true,
    ref: "User"
  },

  Location: {
    type: String,
    required: true,
    maxlength: 50
  },

  Rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  Availability: {
    type: Boolean,
    required: true,
    default: true
  }

});

GuideSchema.pre("save", async function () {
  if (!this.GuideId) {
    this.GuideId = await getNextSequence("GuideId", "G");
  }
});

module.exports = mongoose.model("Guide", GuideSchema);
