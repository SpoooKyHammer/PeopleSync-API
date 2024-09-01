const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  passwordHash: String,
  connected: {
    type: Boolean,
    default: false
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  }]

});

module.exports.usersModel = mongoose.model("users", userSchema);
