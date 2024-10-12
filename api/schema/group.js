const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "messages"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports.Group = mongoose.model("groups", groupSchema);
