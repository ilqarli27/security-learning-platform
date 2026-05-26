const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },

  resetToken: String,
  resetTokenExpires: Date,
});

module.exports = mongoose.model("User", userSchema);
