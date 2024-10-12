const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chats"
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups"
  }
});

module.exports.Message = mongoose.model("messages", messageSchema);
