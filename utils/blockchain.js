/**
 * Blockchain Service
 * A mock blockchain implementation for donation transparency
 */

const Donation = require('../models/Donation');

class BlockchainService {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    
    // Initialize blockchain from database on startup
    this.initializeBlockchain();
  }

  /**
   * Initialize blockchain from database
   * This ensures persistence across server restarts
   */
  async initializeBlockchain() {
    try {
      // Create genesis block if blockchain is empty
      if (this.chain.length === 0) {
        this.createGenesisBlock();
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
    }
  }

  /**
   * Creates the first block in the blockchain (genesis block)
   */
  createGenesisBlock() {
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: this.calculateHash(0, '0', [], new Date().toISOString()),
      nonce: 0
    };
    this.chain.push(genesisBlock);
    return genesisBlock;
  }

  /**
   * Gets the latest block in the blockchain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new donation transaction to pending transactions
   */
  async addDonationTransaction(donorId, charityId, amount, message = '') {
    const transaction = {
      fromAddress: donorId,
      toAddress: charityId,
      amount: amount,
      message: message,
      timestamp: new Date().toISOString(),
      transactionId: this.generateTransactionId(donorId, charityId, amount)
    };

    this.pendingTransactions.push(transaction);
    return transaction;
  }

  /**
   * Generates a unique transaction ID
   */
  generateTransactionId(from, to, amount) {
    const data = from + to + amount + new Date().getTime();
    return this.sha256(data);
  }

  /**
   * Simple hash function (in a real blockchain this would be a proper SHA-256)
   */
  sha256(data) {
    // This is a simplified hash function for demonstration
    // In a real implementation, use a proper crypto library
    let hash = 0;
    if (data.length === 0) return hash.toString(16);
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Mines pending transactions into a new block
   */
  async minePendingTransactions() {
    // Create a new block with all pending transactions
    const block = this.createNewBlock(this.pendingTransactions);
    
    // Add the block to the chain
    this.chain.push(block);
    
    // Reset pending transactions
    this.pendingTransactions = [];
    
    return block;
  }

  /**
   * Creates a new block with the given transactions
   */
  createNewBlock(transactions) {
    const previousBlock = this.getLatestBlock();
    const newIndex = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = previousBlock.hash;
    
    // Create the new block
    const block = {
      index: newIndex,
      timestamp: timestamp,
      transactions: transactions,
      previousHash: previousHash,
      hash: this.calculateHash(newIndex, previousHash, transactions, timestamp),
      nonce: 0
    };
    
    return block;
  }

  /**
   * Calculates the hash of a block
   */
  calculateHash(index, previousHash, transactions, timestamp, nonce = 0) {
    const data = index + previousHash + JSON.stringify(transactions) + timestamp + nonce;
    return this.sha256(data);
  }

  /**
   * Gets all transactions for a specific address (donor or charity)
   */
  async getTransactionsForAddress(address) {
    const transactions = [];
    
    // Loop through all blocks to find relevant transactions
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address || transaction.toAddress === address) {
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
  }

  /**
   * Gets the balance for a specific address
   */
  async getBalanceOfAddress(address) {
    let balance = 0;
    
    // Loop through all blocks to calculate balance
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address) {
          balance -= parseFloat(transaction.amount);
        }
        
        if (transaction.toAddress === address) {
          balance += parseFloat(transaction.amount);
        }
      }
    }
    
    return balance;
  }

  /**
   * Gets the entire blockchain
   */
  async getBlockchain() {
    return {
      chain: this.chain,
      pendingTransactions: this.pendingTransactions
    };
  }

  /**
   * Validates the integrity of the blockchain
   */
  isChainValid() {
    // Check if the chain is valid by verifying each block's hash
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Verify current block's hash
      if (currentBlock.hash !== this.calculateHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.transactions,
        currentBlock.timestamp,
        currentBlock.nonce
      )) {
        return false;
      }
      
      // Verify that current block points to the correct previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  }
}

// Create a singleton instance of the blockchain service
const blockchainService = new BlockchainService();

module.exports = blockchainService;