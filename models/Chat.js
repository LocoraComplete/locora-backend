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
    maxlength: 50,
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
      type: String, // UserId (custom, e.g., U001)
    },
  ],

  CreatedOn: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false });

chatSchema.pre("save", async function () {
  if (!this.ChatId) {
    this.ChatId = await getNextSequence("ChatId", "C");
  }

  // Ensure creator is member
  if (this.CreatedBy && !this.Members.includes(this.CreatedBy)) {
    this.Members.push(this.CreatedBy);
  }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;