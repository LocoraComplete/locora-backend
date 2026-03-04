const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    PostId: { type: String, unique: true },
    UserId: { type: String, required: true },
    ImageId: { type: String, required: true }, // ✅ now STRING (filename)
    Caption: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);