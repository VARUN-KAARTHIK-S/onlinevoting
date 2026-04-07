const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  constituency: {
    type: String,
    required: true
  },
  states: [String],
  unionTerritories: [String],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'finished'],
    default: 'upcoming'
  }
}, { timestamps: true });

module.exports = mongoose.model('Election', electionSchema);
