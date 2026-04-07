const mongoose = require('mongoose');

const constituencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['National', 'State', 'Local'],
    required: true
  },
  state: {
    type: String,
    required: true // Which State/UT it belongs to
  },
  district: String,
  totalVoters: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Constituency', constituencySchema);
