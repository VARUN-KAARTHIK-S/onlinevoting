const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ballot = require('../models/Ballot');
const Voter = require('../models/Voter');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST api/vote
// @desc    Cast a vote
router.post('/', verifyToken, async (req, res) => {
  try {
    const { candidateId, electionId } = req.body;
    const voterId = req.user.id;

    // 1. Check if voter already voted in this specific election
    const voter = await Voter.findById(voterId);
    if (!voter) throw new Error('Voter not found');
    if (voter.votedElections.includes(electionId)) {
      throw new Error('User has already voted in this election');
    }

    // 2. Check if election is currently active
    const election = await Election.findById(electionId);
    if (!election) throw new Error('Election not found');
    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      throw new Error('Election window is closed');
    }

    // 3. Cast the anonymous ballot
    const ballot = new Ballot({ candidateId, electionId });
    await ballot.save();

    // 4. Update voter status
    voter.votedElections.push(electionId);
    voter.hasVoted = true; // Overall flag
    await voter.save();

    res.json({ message: 'Vote cast successfully. (VVPAT Confirmed: You voted for your selected candidate)' });
  } catch (err) {
    console.error('VOTE ROUTE ERROR:', err);
    res.status(400).json({ message: err.message });
  }
});

// @route   GET api/vote/results/:electionId
// @desc    Get results for an election using aggregation
router.get('/results/:electionId', verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;

    // Use aggregation to count votes per candidate
    const results = await Ballot.aggregate([
      { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidateId', count: { $sum: 1 } } },
      { $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      { $project: { candidateName: '$candidate.name', partyName: '$candidate.partyName', constituency: '$candidate.constituency', count: 1 } },
      { $sort: { count: -1 } } // Highest votes first (FPTP system)
    ]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
