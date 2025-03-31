const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Donation = require('../models/Donation');
const BlockchainService = require('../utils/blockchain');

/**
 * @route   POST api/donations
 * @desc    Make a donation
 * @access  Private (donors only)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { charityId, amount, message } = req.body;
    
    // Validate donor role
    const donor = await User.findById(req.user.id);
    if (!donor || donor.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can make donations' });
    }
    
    // Validate charity exists
    const charity = await User.findById(charityId);
    if (!charity || charity.role !== 'charity') {
      return res.status(404).json({ message: 'Charity not found' });
    }
    
    // Add transaction to blockchain ledger
    const blockchainTx = await BlockchainService.addDonationTransaction(
      donor.id,
      charity.id,
      amount,
      message
    );
    
    // Create donation record in database
    const donation = new Donation({
      donor: donor.id,
      charity: charity.id,
      amount,
      message,
      transactionId: blockchainTx.transactionId,
      blockchainTxHash: blockchainTx.hash
    });
    
    await donation.save();
    
    // Mine the pending transactions to create a new block
    const block = await BlockchainService.minePendingTransactions();
    
    res.status(201).json({
      donation: {
        id: donation.id,
        amount,
        message,
        charity: {
          id: charity.id,
          displayName: charity.displayName
        },
        transactionId: donation.transactionId,
        blockchainTxHash: donation.blockchainTxHash,
        createdAt: donation.createdAt
      },
      blockInfo: {
        blockIndex: block.index,
        blockHash: block.hash
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/donations/my-donations
 * @desc    Get user's donations
 * @access  Private
 */
router.get('/my-donations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let donations;
    if (user.role === 'donor') {
      // Get donations made by this donor
      donations = await Donation.find({ donor: req.user.id })
        .sort({ createdAt: -1 })
        .populate('charity', 'displayName');
    } else if (user.role === 'charity') {
      // Get donations received by this charity
      donations = await Donation.find({ charity: req.user.id })
        .sort({ createdAt: -1 })
        .populate('donor', 'displayName');
    } else {
      return res.status(403).json({ message: 'Invalid user role' });
    }
    
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/donations/charity/:charityId
 * @desc    Get donations for a specific charity
 * @access  Private
 */
router.get('/charity/:charityId', auth, async (req, res) => {
  try {
    const { charityId } = req.params;
    
    // Validate charity exists
    const charity = await User.findById(charityId);
    if (!charity || charity.role !== 'charity') {
      return res.status(404).json({ message: 'Charity not found' });
    }
    
    // Get donations for this charity
    const donations = await Donation.find({ charity: charityId })
      .sort({ createdAt: -1 })
      .populate('donor', 'displayName');
    
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/donations/blockchain
 * @desc    Get blockchain ledger data
 * @access  Private
 */
router.get('/blockchain', auth, async (req, res) => {
  try {
    // Get blockchain data
    const blockchain = await BlockchainService.getBlockchain();
    
    res.json(blockchain);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/donations/:id/allocate
 * @desc    Update allocation for a donation (for charities to show how funds are used)
 * @access  Private (charities only)
 */
router.post('/:id/allocate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount } = req.body;
    
    // Validate charity role
    const charity = await User.findById(req.user.id);
    if (!charity || charity.role !== 'charity') {
      return res.status(403).json({ message: 'Only charities can update allocations' });
    }
    
    // Find donation
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Verify this charity is the recipient
    if (donation.charity.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }
    
    // Update allocation
    donation.updateAllocation(category, parseFloat(amount));
    await donation.save();
    
    res.json(donation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;