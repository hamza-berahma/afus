import { connectDB, testConnection, disconnectDB } from '../db/connection.js';
import { User, Cooperative, Product, Transaction, TransactionLog, Favorite } from '../db/models/index.js';
import dotenv from 'dotenv';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database setup
export const setupTestDB = async () => {
  try {
    // Ensure test database connection is established
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to MongoDB test database');
    }
    console.log('✅ Test database connection established');
  } catch (error) {
    console.error('Test database setup error:', error);
    throw error;
  }
};

// Clean test database
export const cleanupTestDB = async () => {
  try {
    // Delete in correct order to respect references
    await TransactionLog.deleteMany({});
    await Transaction.deleteMany({});
    await Favorite.deleteMany({});
    await Product.deleteMany({});
    await Cooperative.deleteMany({});
    await User.deleteMany({});
  } catch (error) {
    // Ignore errors if collections don't exist yet
    console.error('Error cleaning test database:', error);
  }
};

// Global setup
beforeAll(async () => {
  await setupTestDB();
});

// Global teardown
afterAll(async () => {
  await cleanupTestDB();
  await disconnectDB();
});

// Clean between tests
beforeEach(async () => {
  await cleanupTestDB();
});
