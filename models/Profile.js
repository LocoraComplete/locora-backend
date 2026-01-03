const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const ProfileSchema = new mongoose.Schema({
  ProfileId: { 
    type: String,
    unique: true,   
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

ProfileSchema.pre("save", async function () {
  if (!this.ProfileId) {
    this.ProfileId = await getNextSequence("ProfileId", "P");
  }
});

module.exports = mongoose.model("Profile", ProfileSchema);
