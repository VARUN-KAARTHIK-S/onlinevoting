const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Multer storage for PDF affidavits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files and Images are allowed!'), false);
    }
  }
});

// @route   POST api/elections
// @desc    Create an election (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, constituency, startTime, endTime, states, unionTerritories } = req.body;
    const election = new Election({ title, constituency, startTime, endTime, states, unionTerritories });
    await election.save();
    res.status(201).json(election);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/elections
// @desc    Get all elections
router.get('/', verifyToken, async (req, res) => {
  try {
    const elections = await Election.find().sort({ startTime: -1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/elections/:id/candidates
// @desc    Nominate a candidate with affidavit, photo, and optional party symbol
router.post('/:id/candidates', verifyToken, upload.fields([{ name: 'affidavitFile', maxCount: 1 }, { name: 'photoUrl', maxCount: 1 }, { name: 'partySymbolFile', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, partyName, constituency, assets, liabilities, criminalRecords, education } = req.body;
    const electionId = req.params.id;

    if (!req.files || !req.files.affidavitFile || !req.files.photoUrl) {
        return res.status(400).json({ message: 'Both Affidavit PDF and Candidate Photo are required' });
    }

    const candidate = new Candidate({
      name,
      partyName,
      constituency,
      electionId,
      photoUrl: req.files.photoUrl[0].path,
      partySymbolUrl: req.files.partySymbolFile ? req.files.partySymbolFile[0].path : '',
      affidavit: {
        assets,
        liabilities,
        criminalRecords,
        education,
        affidavitFileUrl: req.files.affidavitFile[0].path
      }
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/elections/:id/candidates
// @desc    Get candidates for an election
router.get('/:id/candidates', verifyToken, async (req, res) => {
  try {
    const candidates = await Candidate.find({ electionId: req.params.id });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH api/elections/candidates/:id/approve
// @desc    Approve a candidate (Admin only)
router.patch('/candidates/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE api/elections/candidates/:id
// @desc    Delete a candidate
router.delete('/candidates/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ message: 'Candidate removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT api/elections/candidates/:id
// @desc    Update an existing candidate
router.put('/candidates/:id', verifyToken, isAdmin, upload.fields([{ name: 'affidavitFile', maxCount: 1 }, { name: 'photoUrl', maxCount: 1 }, { name: 'partySymbolFile', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, partyName, constituency, assets, liabilities, criminalRecords, education } = req.body;
    let candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.name = name || candidate.name;
    candidate.partyName = partyName || candidate.partyName;
    candidate.constituency = constituency || candidate.constituency;
    if (assets) candidate.affidavit.assets = assets;
    if (liabilities) candidate.affidavit.liabilities = liabilities;
    if (criminalRecords) candidate.affidavit.criminalRecords = criminalRecords;
    if (education) candidate.affidavit.education = education;

    if (req.files && req.files.photoUrl) candidate.photoUrl = req.files.photoUrl[0].path;
    if (req.files && req.files.partySymbolFile) candidate.partySymbolUrl = req.files.partySymbolFile[0].path;
    if (req.files && req.files.affidavitFile) candidate.affidavit.affidavitFileUrl = req.files.affidavitFile[0].path;

    await candidate.save();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE api/elections/:id
// @desc    Delete an election entirely
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    // Also remove associated candidates
    await Candidate.deleteMany({ electionId: req.params.id });
    res.json({ message: 'Election and its candidates permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
