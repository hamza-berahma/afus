import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { connectDB, testConnection } from './db/connection.js';
import apiRoutes from './api/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'afus-backend'
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        database: 'disconnected', 
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB before starting server (with retry logic)
  console.log('🔄 Connecting to MongoDB...');
  connectDB(3) // 3 retry attempts
    .then(() => {
      // Test connection (non-blocking)
      testConnection().catch(() => {
        console.warn('⚠️  Database connection test failed, but server continues');
      });
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        console.log(`💾 Database health: http://localhost:${PORT}/health/db`);
      });
    })
    .catch((error) => {
      console.error('❌ Failed to connect to MongoDB after retries');
      console.error('⚠️  Server will start but database operations will fail');
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check MONGODB_URI in .env file');
      console.error('   2. Verify MongoDB Atlas IP whitelist includes your IP');
      console.error('   3. Check network connectivity');
      console.error('   4. Verify MongoDB credentials are correct');
      console.error('   5. For development, consider using local MongoDB');
      console.error('');
      console.error('   Starting server anyway for health checks...');
      
      // Start server even if DB connection fails (allows health checks)
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (database disconnected)`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        console.log(`💾 Database health: http://localhost:${PORT}/health/db`);
      });
    });
}

// Export app for testing
export default app;

