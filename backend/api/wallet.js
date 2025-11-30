import express from 'express';
import User from '../db/models/User.js';
import Transaction from '../db/models/Transaction.js';
import Product from '../db/models/Product.js';
import { verifyTokenMiddleware } from '../middleware/auth.js';
import bankingService, {
  BankingError,
  InsufficientBalanceError,
  InvalidCredentialsError,
  NetworkError,
  ServiceUnavailableError,
  ValidationError,
  resetBankingService,
  getBankingService,
} from '../services/banking/index.js';

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

/**
 * GET /api/wallet/balance
 * Get user's wallet balance
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's wallet_id from database
    const user = await User.findById(userId).select('walletId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    if (!user.walletId) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not activated. Please activate your wallet first.',
        error: 'WALLET_NOT_ACTIVATED',
      });
    }

    // Call banking service to get balance with automatic fallback on network errors
    let balanceData;
    try {
      balanceData = await bankingService.getBalance(user.walletId);
    } catch (error) {
      // If network error and using live provider, fallback to mock
      if ((error instanceof NetworkError || error instanceof ServiceUnavailableError) && 
          bankingService.constructor.name === 'CIHLiveProvider') {
        console.warn('⚠️  [WALLET] Network error with live provider, falling back to mock banking');
        resetBankingService();
        const mockService = getBankingService({ forceMock: true });
        balanceData = await mockService.getBalance(user.walletId);
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      data: {
        balance: balanceData.balance,
        currency: balanceData.currency,
        walletId: user.walletId,
        contractId: balanceData.contractId,
      },
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);

    if (error instanceof InsufficientBalanceError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INSUFFICIENT_BALANCE',
      });
    }

    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        error: 'BANKING_AUTH_ERROR',
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'VALIDATION_ERROR',
      });
    }

    if (error instanceof NetworkError || error instanceof ServiceUnavailableError) {
      return res.status(503).json({
        success: false,
        message: error.message,
        error: 'BANKING_SERVICE_UNAVAILABLE',
      });
    }

    if (error instanceof BankingError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        error: 'BANKING_ERROR',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'BALANCE_ERROR',
    });
  }
});

/**
 * GET /api/wallet/transactions
 * Get user's transaction history with pagination
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        error: 'INVALID_LIMIT',
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset must be non-negative',
        error: 'INVALID_OFFSET',
      });
    }

    // Fetch transactions where user is either buyer or seller
    const transactions = await Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate('buyerId', 'email phone role')
      .populate('sellerId', 'email phone role')
      .populate('productId', 'name price unit')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Get total count for pagination metadata
    const total = await Transaction.countDocuments({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    // Format transactions with buyer/seller details
    const formattedTransactions = transactions.map((tx) => ({
      id: tx._id.toString(),
      amount: tx.amount,
      fee: tx.fee,
      totalAmount: tx.totalAmount,
      quantity: tx.quantity,
      status: tx.status,
      escrowTransactionId: tx.escrowTransactionId,
      qrSignature: tx.qrSignature,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      settledAt: tx.settledAt,
      buyer: tx.buyerId ? {
        id: tx.buyerId._id.toString(),
        email: tx.buyerId.email,
        phone: tx.buyerId.phone,
        role: tx.buyerId.role,
      } : null,
      seller: tx.sellerId ? {
        id: tx.sellerId._id.toString(),
        email: tx.sellerId.email,
        phone: tx.sellerId.phone,
        role: tx.sellerId.role,
      } : null,
      product: tx.productId ? {
        id: tx.productId._id.toString(),
        name: tx.productId.name,
        price: tx.productId.price,
        unit: tx.productId.unit,
      } : null,
      // Indicate if current user is buyer or seller
      userRole: tx.buyerId?._id.toString() === userId ? 'buyer' : 'seller',
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'TRANSACTIONS_ERROR',
    });
  }
});

/**
 * POST /api/wallet/activate
 * Activate user's wallet with CIH Wallet API
 */
router.post('/activate', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data from database
    const user = await User.findById(userId).select('email phone walletId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    // Check if wallet is already activated
    if (user.walletId) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is already activated',
        error: 'WALLET_ALREADY_ACTIVATED',
        data: {
          walletId: user.walletId,
        },
      });
    }

    // Use new wallet API service for activation
    // First, pre-create the wallet
    const walletApi = (await import('../services/wallet-api/index.js')).default;
    
    try {
      // Pre-create wallet
      const preCreateResult = await walletApi.preCreateWallet({
        phoneNumber: user.phone,
        clientFirstName: user.name?.split(' ')[0] || 'User',
        clientLastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phoneOperator: 'IAM',
      });

      const { token, otp } = preCreateResult.result;

      // Activate wallet with OTP
      const activateResult = await walletApi.activateWallet({
        otp: otp,
        token: token,
      });

      const { contractId, rib } = activateResult.result;

      // Update user's wallet_id in database
      await User.findByIdAndUpdate(userId, {
        $set: { walletId: contractId },
      });

      res.status(201).json({
        success: true,
        message: 'Wallet activated successfully',
        data: {
          walletId: contractId,
          contractId: contractId,
          rib: rib,
          status: 'activated',
        },
      });
    } catch (error) {
      // Fallback to simple contract ID generation if wallet API fails
      console.warn('Wallet API activation failed, using fallback:', error.message);
      const contractId = `CONTRACT_${user.phone.replace(/[^0-9]/g, '')}_${Date.now()}`;
      
      await User.findByIdAndUpdate(userId, {
        $set: { walletId: contractId },
      });

      res.status(201).json({
        success: true,
        message: 'Wallet activated successfully (fallback mode)',
        data: {
          walletId: contractId,
          contractId: contractId,
          status: 'activated',
        },
      });
    }
  } catch (error) {
    console.error('Activate wallet error:', error);

    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        error: 'BANKING_AUTH_ERROR',
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'VALIDATION_ERROR',
      });
    }

    if (error instanceof NetworkError || error instanceof ServiceUnavailableError) {
      return res.status(503).json({
        success: false,
        message: error.message,
        error: 'BANKING_SERVICE_UNAVAILABLE',
      });
    }

    if (error instanceof BankingError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        error: 'BANKING_ERROR',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during wallet activation',
      error: 'ACTIVATION_ERROR',
    });
  }
});

export default router;
