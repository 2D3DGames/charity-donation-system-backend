const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  charity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  blockchainTxHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // For fund allocation tracking
  allocation: {
    type: Map,
    of: Number,
    default: new Map()
  }
});

// Virtual field for formatted date
DonationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to update allocation
DonationSchema.methods.updateAllocation = function(category, amount) {
  if (!this.allocation) {
    this.allocation = new Map();
  }
  
  const currentAmount = this.allocation.get(category) || 0;
  this.allocation.set(category, currentAmount + amount);
};

// Index for faster queries
DonationSchema.index({ donor: 1, createdAt: -1 });
DonationSchema.index({ charity: 1, createdAt: -1 });
DonationSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Donation', DonationSchema);