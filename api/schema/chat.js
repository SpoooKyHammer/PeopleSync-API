const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "messages"
  }]
});

module.exports.Chat = mongoose.model("chats", chatSchema);
