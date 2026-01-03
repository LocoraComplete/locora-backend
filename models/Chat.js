const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const chatSchema = new mongoose.Schema({
  ChatId: {
    type: String,
    unique: true,
  },

  GroupName: {
    type: String,
    required: true,
    maxlength: 50
  },

  CreatedBy: {
    type: String,         
    required: true,
    ref: "User"
  },

  CreatedOn: {
    type: Date,
    default: Date.now
  }

}, { timestamps: false });

chatSchema.pre("save", async function () {
  if (!this.ChatId) {
    this.ChatId = await getNextSequence("ChatId", "C");
  }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
