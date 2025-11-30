import express from 'express';
import authRoutes from './auth.js';
import walletRoutes from './wallet.js';
import walletApiRoutes from './wallet-api.js';
import transactionRoutes from './transactions.js';
import productRoutes from './products.js';
import cooperativeRoutes from './cooperatives.js';
import dashboardRoutes from './dashboard.js';
import creditScoreRoutes from './creditScore.js';
import favoriteRoutes from './favorites.js';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/wallet-api', walletApiRoutes); // New comprehensive wallet API
router.use('/transactions', transactionRoutes);
router.use('/products', productRoutes);
router.use('/cooperatives', cooperativeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/credit-score', creditScoreRoutes);
router.use('/favorites', favoriteRoutes);

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'Afus API' });
});

export default router;

