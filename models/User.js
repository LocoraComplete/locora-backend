const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  UserId: { type: String, unique: true },
  Name: { type: String, required: true, trim: true, maxlength: 50 },
  Bio: { type: String, default: "", trim: true, maxlength: 200 },
  profilePic: { type: String, default: "" },
  Handle: { type: String, unique: true, trim: true },
  Email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 50 },
  Password: { type: String, required: true, minlength: 6 },
  Phone: { type: String, unique: true, sparse: true, trim: true, maxlength: 13 },
  Pronouns: { type: String, trim: true, maxlength: 30, default: "" },
  Gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  emergencyContacts: {
    primary: { type: String, required: true, match: [/^\+91\d{10}$/, "Invalid primary emergency number"], maxlength: 13 },
    secondary: { type: String, required: false, match: [/^\+91\d{10}$/, "Invalid secondary emergency number"], maxlength: 13 },
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;