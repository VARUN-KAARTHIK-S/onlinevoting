const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Voter = require('../models/Voter');
const { verifyToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');

// Multer storage for Voter Photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-voter-${file.originalname}`);
  }
});
const upload = multer({ storage });

const nodemailer = require('nodemailer');

// Helper for Email Validation
const isValidEmailIdx = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Simulated Human Face Detection (Vision API Simulation)
const detectHumanFace = async (photoPath) => {
  console.log(`[FACE SCRUTINY]: Analyzing photo at ${photoPath}... (PASSED)`);
  // Always return true for development/testing
  return true;
};

// Simulated Email Transporter
const sendVoterIdEmail = async (email, voterId, name) => {
  console.log(`[SIMULATED MAIL to ${email}]:
  ------------------------------------------------------------
  Hello ${name},
  
  Your application for the digital Voter ID has been APPROVED.
  
  OFFICIAL EPIC ID: ${voterId}
  
  Please use this ID, your registered phone number, and password 
   to cast your vote at http://localhost:5173/login
  
  Digital Democracy, Empowered.
  Secure Online Voting System Team
  ------------------------------------------------------------`);
  return true;
};

// Helper to calculate age from DOB
const calculateAgeIdx = (dob) => {
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// @route   POST api/auth/register
// @desc    Register a new voter with ID photo, Email, Aadhaar, DOB, and Face verification
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, password, phoneNumber, aadhaarNumber, dob, constituency, role } = req.body;
    
    console.log('--- NEW REGISTRATION ATTEMPT ---');
    console.log('Role:', role);
    console.log('Body:', { name, email, phoneNumber, aadhaarNumber, dob, constituency });
    console.log('File:', req.file ? req.file.filename : 'NOT RECEIVED');

    // 1. Core Data Validation
    if (!name || !email || !password || (role !== 'admin' && !constituency)) {
      console.log('Rejection: Missing core fields');
      return res.status(400).json({ message: 'Please provide all required registration details.' });
    }

    // 2. Email Format Validation
    if (!isValidEmailIdx(email)) {
      console.log('Rejection: Invalid Email format');
      return res.status(400).json({ message: 'Please provide a valid official email address.' });
    }

    // 3. Citizen-Specific Validations
    if (role !== 'admin') {
      // Age Validation (18+)
      if (!dob || calculateAgeIdx(dob) < 18) {
        console.log('Rejection: Age is under 18 or DOB missing');
        return res.status(400).json({ message: 'Registration Failed: You must be at least 18 years old to apply for a Voter ID.' });
      }

      // Aadhaar Validation (12 digits)
      if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
        console.log('Rejection: Invalid Aadhaar format');
        return res.status(400).json({ message: 'Please provide a valid 12-digit Aadhaar number.' });
      }

      if (!req.file) {
        console.log('Rejection: Photo missing for Citizen');
        return res.status(400).json({ message: 'Voter profile photo is required for Citizens.' });
      }

      // Simulated Face Scrutiny (Always pass for testing)
      await detectHumanFace(req.file.path);
    }

    let query = { $or: [{ email }] };
    if (phoneNumber) query.$or.push({ phoneNumber });
    if (aadhaarNumber) query.$or.push({ aadhaarNumber });

    let voter = await Voter.findOne(query);
    if (voter) {
      console.log('Rejection: Duplicate User detected');
      return res.status(400).json({ message: 'A citizen with this email, phone, or Aadhaar already exists' });
    }

    voter = new Voter({ 
      name, 
      email, 
      password, 
      phoneNumber, 
      aadhaarNumber,
      dob,
      constituency: constituency || 'HQ',
      photoUrl: req.file ? req.file.path : '',
      role: 'user', // FORCE user role regardless of payload
      isApproved: false // Awaits Admin approval
    });
    
    console.log('Final Step: Saving Voter to Database...');
    await voter.save();
    console.log('SUCCESS: Voter saved. VoterID Generated.');

    // Send email with Voter ID
    await sendVoterIdEmail(voter.email, voter.voterId, voter.name);

    res.status(201).json({ 
      message: 'Citizen registered successfully. Voter ID sent to registered email.', 
      voterId: voter.voterId, 
      voter: { id: voter._id, name: voter.name, voterId: voter.voterId, email: voter.email } 
    });
  } catch (err) {
    console.error('CRITICAL REGISTRATION ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/auth/login-admin
// @desc    Direct Login for Election Officials (Email & Password)
router.post('/login-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Explicitly check for admin role
    const admin = await Voter.findOne({ email, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Official account not found or invalid privileges.' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token, 
      voter: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/auth/login-step1
// @desc    Verify credentials and send OTP
router.post('/login-step1', async (req, res) => {
  try {
    const { voterId, phoneNumber, password } = req.body;

    const voter = await Voter.findOne({ voterId, phoneNumber });
    if (!voter) return res.status(404).json({ message: 'Invalid Voter ID or Phone Number' });

    if (!voter.isApproved && voter.role !== 'admin') {
      return res.status(403).json({ message: 'Your registration is currently pending review by the Election Commission.' });
    }

    const isMatch = await voter.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    // Simulate sending OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    voter.otp = otp;
    voter.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await voter.save();

    console.log(`[SIMULATED OTP for ${phoneNumber}]: ${otp}`);
    res.json({ message: `OTP sent to ${phoneNumber} (Simulated: ${otp})` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/auth/login-step2
// @desc    Verify OTP (BYPASS FOR TESTING) and return token
router.post('/login-step2', async (req, res) => {
  try {
    const { voterId, otp } = req.body;

    // FIND VOTER BY ID ONLY (Bypassing OTP match for now as requested)
    const voter = await Voter.findOne({ voterId });
    if (!voter) return res.status(404).json({ message: 'Identity not found for this EPIC.' });

    // Clear OTP fields
    voter.otp = null;
    voter.otpExpires = null;
    await voter.save();

    const token = jwt.sign({ id: voter._id, role: voter.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, voter: { id: voter._id, name: voter.name, email: voter.email, voterId: voter.voterId, role: voter.role, hasVoted: voter.hasVoted } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/auth/profile
// @desc    Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const voter = await Voter.findById(req.user.id).select('-password');
    res.json(voter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/auth/voters
// @desc    Get all registered voters (Admin only)
router.get('/voters', verifyToken, async (req, res) => {
  try {
    const adminCheck = await Voter.findById(req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Election Officials only.' });
    }
    const voters = await Voter.find({ role: 'user' }).select('-password -otp -otpExpires').sort({ createdAt: -1 });
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH api/auth/voters/:id/approve
// @desc    Approve a pending voter registration
router.patch('/voters/:id/approve', verifyToken, async (req, res) => {
  try {
    const adminCheck = await Voter.findById(req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    
    await Voter.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.json({ message: 'Voter approved successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE api/auth/voters/:id/reject
// @desc    Reject and delete a pending voter registration
router.delete('/voters/:id/reject', verifyToken, async (req, res) => {
  try {
    const adminCheck = await Voter.findById(req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    await Voter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voter application rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
