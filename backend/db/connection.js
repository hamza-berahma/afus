import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string
// Supports both local and cloud MongoDB (MongoDB Atlas)
const MONGODB_URI = process.env.MONGODB_URI || 
  `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'sou9na'}`;

// Connection options
// For cloud MongoDB (Atlas), SSL/TLS is automatically handled via the connection string
const options = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  // Increased timeouts for cloud connections
  serverSelectionTimeoutMS: 30000, // 30 seconds for Atlas
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  // Retry settings
  retryWrites: true,
  retryReads: true,
  // Heartbeat settings
  heartbeatFrequencyMS: 10000,
};

// Connection state
let isConnected = false;

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<void>}
 */
export const connectDB = async (retries = 3) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  // Set up event handlers (only once)
  if (!mongoose.connection.listeners('error').length) {
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${attempt}/${retries})...`);
      
      const conn = await mongoose.connect(MONGODB_URI, options);
      isConnected = true;
      
      // Verify connection is actually ready
      if (mongoose.connection.readyState === 1) {
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        return;
      } else {
        throw new Error('Connection established but not ready');
      }
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoServerSelectionError') {
        console.error(`❌ MongoDB server selection failed (attempt ${attempt}/${retries}):`);
        console.error(`   ${error.message}`);
        
        if (error.reason) {
          console.error(`   Reason: ${error.reason.type || 'Unknown'}`);
        }
        
        if (isLastAttempt) {
          console.error('\n💡 Troubleshooting tips:');
          console.error('   1. Check your MONGODB_URI in .env file');
          console.error('   2. Verify MongoDB Atlas IP whitelist includes your IP');
          console.error('   3. Check network connectivity');
          console.error('   4. Verify MongoDB credentials are correct');
          console.error('   5. Try using a local MongoDB instance for development');
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`   Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Other errors - throw immediately
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        throw error;
      }
    }
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const testConnection = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    
    // Wait for connection to be fully ready
    let retries = 10;
    while (mongoose.connection.readyState !== 1 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries--;
    }
    
    // Test the connection with a simple operation
    if (mongoose.connection.readyState === 1) {
      // Try to ping if db is available
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      console.log('✅ MongoDB connection test successful');
      return true;
    } else {
      throw new Error('Connection not ready');
    }
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    return false;
  }
};

/**
 * Get connection status
 * @returns {boolean}
 */
export const getConnectionStatus = () => isConnected;

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

// Auto-connect on import (disabled for migrations/scripts, enable for server)
// Set AUTO_CONNECT_DB=true in .env to enable auto-connect
if (process.env.AUTO_CONNECT_DB === 'true') {
  connectDB().catch((err) => {
    console.error('Failed to auto-connect to MongoDB:', err.message);
  });
}

export default mongoose;
