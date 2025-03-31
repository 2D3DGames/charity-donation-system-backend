require('dotenv').config();

module.exports = {
  // MongoDB connection string
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/charity-donation-system',
  
  // JWT secret for authentication
  jwtSecret: process.env.JWT_SECRET || 'charity-donation-secret-key',
  
  // JWT token expiration (in seconds)
  jwtExpiration: 86400, // 24 hours
  
  // Server port
  port: process.env.PORT || 5000,
  
  // CORS origin
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};