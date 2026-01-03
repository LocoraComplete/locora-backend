const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const sosAlertSchema = new mongoose.Schema({

  AlertId: {
    type: String,
    unique: true,
  },

  UserId: {
    type: String,     
    required: true,
    ref: "User"
  },

  Latitude: {
    type: Number,
    required: true
  },

  Longitude: {
    type: Number,
    required: true
  },

  Timestamp: {
    type: Date,
    default: Date.now
  }

}, { timestamps: false });

sosAlertSchema.pre("save", async function () {
  if (!this.AlertId) {
    this.AlertId = await getNextSequence("AlertId", "S");
  }
});

const SOSAlert = mongoose.model("SOSAlert", sosAlertSchema);

module.exports = SOSAlert;
