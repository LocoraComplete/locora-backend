const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const chatSchema = new mongoose.Schema({
  ChatId: {
    type: String,
    unique: true,
  },

  ChatType: {
    type: String,
    enum: ["group", "private"],
    default: "group",
  },

  GroupName: {
    type: String,
    required: function () {
      return this.ChatType === "group";
    },
  },

  Description: {
    type: String,
    maxlength: 200,
    default: "",
  },

  CreatedBy: {
    type: String,
    required: true,
  },

  Members: [
    {
      type: String,
    },
  ],

  LastMessage: {
    type: String,
    default: "",
  },

  LastMessageTime: {
    type: Date,
  },

  LastMessageSender: {
    type: String,
  },

  UnreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },

  CreatedOn: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.pre("save", async function () {
  if (!this.ChatId) {
    this.ChatId = await getNextSequence("ChatId", "C");
  }

  if (this.CreatedBy && !this.Members.includes(this.CreatedBy)) {
    this.Members.push(this.CreatedBy);
  }
});

module.exports = mongoose.model("Chat", chatSchema);