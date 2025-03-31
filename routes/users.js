const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   GET api/users/charities
 * @desc    Get all charities
 * @access  Private
 */
router.get('/charities', auth, async (req, res) => {
  try {
    // Find all users with role 'charity'
    const charities = await User.find({ role: 'charity' })
      .select('-password')
      .sort({ displayName: 1 });
    
    res.json(charities);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/users/charity/:id
 * @desc    Get charity details by ID
 * @access  Private
 */
router.get('/charity/:id', auth, async (req, res) => {
  try {
    const charity = await User.findById(req.params.id).select('-password');
    
    if (!charity || charity.role !== 'charity') {
      return res.status(404).json({ message: 'Charity not found' });
    }
    
    res.json(charity);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, description, mission, website, categories, preferences } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (displayName) user.displayName = displayName;
    
    // Update charity-specific fields
    if (user.role === 'charity') {
      if (description) user.description = description;
      if (mission) user.mission = mission;
      if (website) user.website = website;
      if (categories) user.categories = categories;
    }
    
    // Update donor-specific fields
    if (user.role === 'donor') {
      if (preferences) user.preferences = preferences;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;