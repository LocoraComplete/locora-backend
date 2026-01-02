const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema({
  UserId: {
    type: String,
    required: true,
    unique: true
  },
  Name: {
    type: String,
    required: true,
    maxlength: 50
  },
  Email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  },
  Password: {
    type: String,
    required: true,
    maxlength: 100
  },
  Phone: {
    type: String,
    unique: true,
    maxlength: 15
  },
  Gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other"
  }
}, { timestamps: true });

// Create the model
const User = mongoose.model("User", userSchema);

module.exports = User;
