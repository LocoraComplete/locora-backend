const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const userSchema = new mongoose.Schema({
  UserId: {
    type: String,
    unique: true,
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

userSchema.pre("save", async function () {
  if (!this.UserId) {
    this.UserId = await getNextSequence("UserId", "U");
  }
});


const User = mongoose.model("User", userSchema);

module.exports = User;
