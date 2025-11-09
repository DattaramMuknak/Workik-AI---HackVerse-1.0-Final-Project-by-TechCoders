// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  email: String,
  avatarUrl: String,
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: String,
  repositories: [{
    id: String,
    name: String,
    fullName: String,
    private: Boolean,
    lastAccessed: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);