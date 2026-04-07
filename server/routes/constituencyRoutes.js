const express = require('express');
const router = express.Router();
const Constituency = require('../models/Constituency');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/constituencies
// @desc    Get all constituencies
router.get('/', async (req, res) => {
  try {
    const list = await Constituency.find().sort('name');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/constituencies
// @desc    Add a new constituency (Admin only)
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { name, type, state, district } = req.body;
    const exists = await Constituency.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Constituency already exists' });

    const cons = new Constituency({ name, type, state, district });
    await cons.save();
    res.status(201).json(cons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
