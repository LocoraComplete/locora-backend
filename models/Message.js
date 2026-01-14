const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const messageSchema = new mongoose.Schema({
  MessageId: {
    type: String,
    unique: true
  },

  ChatId: {
    type: String,
    required: true,
    ref: "Chat"
  },

  SenderId: {
    type: String,
    required: true,
    ref: "User"
  },

  Text: {
    type: String,
    required: true,
    maxlength: 1000
  },

  CreatedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: false });

messageSchema.pre("save", async function () {
  if (!this.MessageId) {
    this.MessageId = await getNextSequence("MessageId", "M");
  }
});

module.exports = mongoose.model("Message", messageSchema);
