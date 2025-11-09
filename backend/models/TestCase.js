// backend/models/TestCase.js
const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repository: {
    owner: String,
    name: String,
    fullName: String
  },
  files: [{
    path: String,
    content: String,
    language: String
  }],
  summaries: [{
    id: String,
    title: String,
    description: String,
    testType: String,
    framework: String,
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
  }],
  generatedCode: [{
    summaryId: String,
    code: String,
    filename: String,
    framework: String,
    language: String
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestCase', testCaseSchema);