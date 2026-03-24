const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  UserId: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
{
  PostId: { type: String, unique: true },
  UserId: { type: String, required: true },

  ImageIds: [{ type: String, required: true }], 

  Caption: { type: String, trim: true, maxlength: 300 },

  likes: [{ type: String }],
  comments: [commentSchema]
},
{ timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);