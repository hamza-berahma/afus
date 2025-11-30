import { connectDB, testConnection, disconnectDB } from './connection.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Run database migrations (MongoDB doesn't need schema migrations, but we can create indexes)
 */
async function migrate() {
  try {
    console.log('🔄 Running database setup...');
    
    // Test connection first
    console.log('🔍 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to MongoDB database!');
    }
    
    console.log('✅ Database connection successful');
    
    // MongoDB doesn't require schema migrations like SQL databases
    // Indexes are automatically created by Mongoose based on schema definitions
    // However, we can verify the connection and optionally create indexes here
    
    console.log('📝 MongoDB indexes will be created automatically by Mongoose models');
    console.log('✅ Database setup completed successfully!');
    
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!');
    
    if (error.message.includes('connect') || error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
      console.error('   Error: Cannot connect to MongoDB server');
      console.error('\n📋 Troubleshooting steps:');
      
      const isCloud = process.env.MONGODB_URI?.includes('mongodb+srv://') || process.env.MONGODB_URI?.includes('mongodb.net');
      
      if (isCloud) {
        console.error('   🔵 Detected MongoDB Atlas (Cloud) connection');
        console.error('   1. Verify your connection string in .env:');
        console.error('      MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sou9na?retryWrites=true&w=majority');
        console.error('   2. Check your MongoDB Atlas dashboard:');
        console.error('      - Ensure your IP address is whitelisted (Network Access)');
        console.error('      - Verify database user credentials are correct');
        console.error('      - Ensure cluster is running (not paused)');
        console.error('   3. URL-encode special characters in password:');
        console.error('      @ → %40, # → %23, $ → %24, etc.');
        console.error('   4. See docs/MONGODB_SETUP.md for detailed setup guide');
      } else {
        console.error('   🟢 Detected local MongoDB connection');
        console.error('   1. Make sure MongoDB is installed:');
        console.error('      sudo pacman -S mongodb');
        console.error('   2. Start MongoDB service:');
        console.error('      sudo systemctl start mongodb');
        console.error('      sudo systemctl enable mongodb');
        console.error('   3. Check your .env file has correct database config:');
        console.error('      MONGODB_URI=mongodb://localhost:27017/sou9na');
        console.error('      OR');
        console.error('      DB_HOST=localhost');
        console.error('      DB_PORT=27017');
        console.error('      DB_NAME=sou9na');
      }
      
      console.error('\n💡 Current connection config:');
      const dbConfig = process.env.MONGODB_URI 
        ? `URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}` // Hide password
        : `Host: ${process.env.DB_HOST || 'localhost'}, Port: ${process.env.DB_PORT || 27017}, Database: ${process.env.DB_NAME || 'sou9na'}`;
      console.error(`   ${dbConfig}\n`);
    } else {
      console.error(`   Error: ${error.message}`);
      if (process.env.NODE_ENV === 'development') {
        console.error('\n   Stack trace:');
        console.error(error.stack);
      }
    }
    
    await disconnectDB();
    process.exit(1);
  }
}

// Run migration
migrate();
