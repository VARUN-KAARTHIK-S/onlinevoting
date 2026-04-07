const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  partySymbolUrl: {
    type: String
  },
  constituency: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  affidavit: {
    assets: {
      type: Number,
      required: true
    },
    liabilities: {
      type: Number,
      required: true
    },
    criminalRecords: {
      type: String,
      default: 'No records'
    },
    education: {
      type: String,
      required: true
    },
    affidavitFileUrl: {
      type: String,
      required: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
