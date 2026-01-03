const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const reviewSchema = new mongoose.Schema({

  ReviewId: {
    type: String,
    unique: true
  },

  UserId: {
    type: String,
    required: true,
    ref: "User"     
  },

  PlaceId: {
    type: String,
    required: true,
    ref: "Place"    
  },

  Rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  Comment: {
    type: String,
    maxlength: 500
  },

  Date: {
    type: Date,
    required: true,
    default: Date.now
  }

}, { timestamps: true });

reviewSchema.pre("save", async function () {
  if (!this.ReviewId) {
    this.ReviewId = await getNextSequence("ReviewId", "R");
  }
});

module.exports = mongoose.model("Review", reviewSchema);
