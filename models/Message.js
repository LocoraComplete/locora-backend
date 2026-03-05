const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const messageSchema = new mongoose.Schema({
  MessageId: {
    type: String,
    unique: true,
  },

  ChatId: {
    type: String,
    required: true,
    ref: "Chat",
    index: true,
  },

  SenderId: {
    type: String,
    default: null,
    ref: "User",
  },

  Text: {
    type: String,
    required: true,
    maxlength: 1000,
  },

  Type: {
    type: String,
    enum: ["text", "image", "location", "system"],
    default: "text",
  },

  MediaUrl: {
    type: String,
    default: null,
  },

  ReadBy: [
    {
      type: String,
      ref: "User",
    },
  ],

  CreatedAt: {
    type: Date,
    default: Date.now,
  },

  IsSystem: {
    type: Boolean,
    default: false,
  },

  Status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },
});

messageSchema.index({ ChatId: 1, CreatedAt: 1 });

messageSchema.pre("save", async function () {
  if (!this.MessageId) {
    this.MessageId = await getNextSequence("MessageId", "M");
  }
});

module.exports = mongoose.model("Message", messageSchema);