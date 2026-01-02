const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  ProfileId: { 
    type: String,
    unique: true,
    required: true     // 👈 add this
  },

  UserId: { 
    type: String, 
    required: true,
    ref: "User"
  },

  Bio: { type: String, maxlength: 200 },

  Interests: { type: String, maxlength: 100 },

  ProfilePic: { type: String }
});

module.exports = mongoose.model("Profile", ProfileSchema);
