const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const voterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  photoUrl: {
    type: String
  },
  voterId: {
    type: String,
    unique: true
  },
  aadhaarNumber: {
    type: String,
    unique: true
  },
  dob: {
    type: Date
  },
  constituency: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votedElections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  }],
  isApproved: {
    type: Boolean,
    default: true // defaults to true for existing db compatibility, handled at route level for new
  }
}, { timestamps: true });

// Pre-save hook to hash password and generate Voter ID (EPIC)
voterSchema.pre('save', async function() {
  if (this.isNew) {
    // Generate a simple unique Voter ID: EPIC + 6 random digits
    this.voterId = 'EPIC' + Math.floor(100000 + Math.random() * 900000);
  }
  
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
voterSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Voter', voterSchema);
