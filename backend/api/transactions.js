import express from 'express';
import Transaction from '../db/models/Transaction.js';
import TransactionLog from '../db/models/TransactionLog.js';
import User from '../db/models/User.js';
import Product from '../db/models/Product.js';
import { verifyTokenMiddleware, roleCheck } from '../middleware/auth.js';
import {
  simulateTransaction,
  createEscrowTransaction,
  releaseEscrow,
  generateQRSignature,
} from '../services/transactionService.js';
import bankingService from '../services/banking/index.js';

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

/**
 * Helper function to verify transaction ownership
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID
 * @param {string} requiredRole - Required role (buyer or seller)
 * @returns {Promise<Object>} Transaction data
 */
const verifyTransactionOwnership = async (transactionId, userId, requiredRole = null) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Check if user is buyer or seller
  const isBuyer = transaction.buyerId.toString() === userId;
  const isSeller = transaction.sellerId.toString() === userId;

  if (!isBuyer && !isSeller) {
    throw new Error('Unauthorized: You are not authorized to access this transaction');
  }

  // Check required role if specified
  if (requiredRole === 'buyer' && !isBuyer) {
    throw new Error('Unauthorized: Only the buyer can perform this action');
  }

  if (requiredRole === 'seller' && !isSeller) {
    throw new Error('Unauthorized: Only the seller can perform this action');
  }

  return transaction;
};

/**
 * POST /api/transactions/simulate
 * Simulate transaction to get fee breakdown
 */
router.post('/simulate', verifyTokenMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const buyerId = req.user.userId;

    // Validate inputs
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'productId and quantity are required',
        error: 'MISSING_FIELDS',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
        error: 'INVALID_QUANTITY',
      });
    }

    // Call transaction service to simulate
    const simulation = await simulateTransaction(buyerId, productId, quantity);

    res.json({
      success: true,
      data: {
        productCost: simulation.productCost,
        fee: simulation.fee,
        totalCost: simulation.totalCost,
        breakdown: {
          productCost: simulation.productCost,
          transactionFee: simulation.fee,
          total: simulation.totalCost,
        },
      },
    });
  } catch (error) {
    console.error('Simulate transaction error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not activated')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'RESOURCE_NOT_FOUND',
      });
    }

    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INSUFFICIENT_STOCK',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SIMULATION_ERROR',
    });
  }
});

/**
 * POST /api/transactions/create
 * Create escrow transaction
 */
router.post('/create', verifyTokenMiddleware, async (req, res) => {
  try {
    const { productId, quantity, simulatedFee } = req.body;
    const buyerId = req.user.userId;

    // Validate inputs
    if (!productId || !quantity || simulatedFee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'productId, quantity, and simulatedFee are required',
        error: 'MISSING_FIELDS',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
        error: 'INVALID_QUANTITY',
      });
    }

    // Get buyer's wallet balance
    const buyer = await User.findById(buyerId).select('walletId');

    if (!buyer || !buyer.walletId) {
      return res.status(400).json({
        success: false,
        message: 'Buyer wallet not activated',
        error: 'WALLET_NOT_ACTIVATED',
      });
    }

    // Simulate transaction to get actual costs
    const simulation = await simulateTransaction(buyerId, productId, quantity);

    // Verify simulated fee matches (with small tolerance for rounding)
    const feeDifference = Math.abs(simulation.fee - simulatedFee);
    if (feeDifference > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Fee mismatch. Please simulate again.',
        error: 'FEE_MISMATCH',
      });
    }

    // Check if user has sufficient balance
        const balanceData = await bankingService.getBalance(buyer.walletId);
    
    if (balanceData.balance < simulation.totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        error: 'INSUFFICIENT_BALANCE',
        data: {
          required: simulation.totalCost,
          available: balanceData.balance,
        },
      });
    }

    // Create escrow transaction
    const transaction = await createEscrowTransaction(
      buyerId,
      productId,
      quantity,
      simulation
    );

    res.status(201).json({
      success: true,
      message: 'Transaction created and funds escrowed',
      data: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        escrowTransactionId: transaction.escrowTransactionId,
        amount: transaction.amount,
        fee: transaction.fee,
        totalAmount: transaction.totalAmount,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);

    if (error.message.includes('not found') || error.message.includes('not activated')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'RESOURCE_NOT_FOUND',
      });
    }

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INSUFFICIENT_BALANCE',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'TRANSACTION_CREATION_ERROR',
    });
  }
});

/**
 * POST /api/transactions/:id/ship
 * Mark transaction as shipped and generate QR code
 */
router.post('/:id/ship', verifyTokenMiddleware, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    // Verify transaction belongs to user (must be seller)
    const transaction = await verifyTransactionOwnership(transactionId, userId);
    const isSeller = transaction.sellerId.toString() === userId;
    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can ship this transaction',
        error: 'UNAUTHORIZED',
      });
    }

    // Check current status
    if (transaction.status !== 'ESCROWED') {
      return res.status(400).json({
        success: false,
        message: `Transaction must be ESCROWED to ship. Current status: ${transaction.status}`,
        error: 'INVALID_STATUS',
      });
    }

    // Update status to SHIPPED
    transaction.status = 'SHIPPED';
    await transaction.save();

    // Log status change
    await TransactionLog.create({
      transactionId: transaction._id,
      status: 'SHIPPED',
      message: 'Product shipped by seller',
    });

    // Generate QR code payload and signature
    const timestamp = new Date(transaction.createdAt).getTime();
    const qrSignature = generateQRSignature(transactionId, transaction.totalAmount, timestamp);

    // Update transaction with QR signature
    transaction.qrSignature = qrSignature;
    await transaction.save();

    // QR code payload
    const qrPayload = {
      transaction_id: transactionId,
      amount: transaction.totalAmount,
      timestamp: timestamp,
    };

    res.json({
      success: true,
      message: 'Transaction marked as shipped',
      data: {
        transactionId,
        status: 'SHIPPED',
        qrCode: {
          payload: qrPayload,
          signature: qrSignature,
          // Base64 encoded for easy QR code generation
          encoded: Buffer.from(JSON.stringify({ ...qrPayload, signature: qrSignature })).toString('base64'),
        },
      },
    });
  } catch (error) {
    console.error('Ship transaction error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SHIP_ERROR',
    });
  }
});

/**
 * POST /api/transactions/:id/mark-delivered
 * Mark transaction as delivered (buyer confirms receipt)
 */
router.post('/:id/mark-delivered', verifyTokenMiddleware, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    // Verify transaction belongs to user (buyer or seller)
    const transaction = await verifyTransactionOwnership(transactionId, userId);

    // Check current status
    if (transaction.status !== 'SHIPPED') {
      return res.status(400).json({
        success: false,
        message: `Transaction must be SHIPPED to mark as delivered. Current status: ${transaction.status}`,
        error: 'INVALID_STATUS',
      });
    }

    // Update status to DELIVERED
    transaction.status = 'DELIVERED';
    await transaction.save();

    // Log status change
    await TransactionLog.create({
      transactionId: transaction._id,
      status: 'DELIVERED',
      message: 'Product marked as delivered by buyer',
    });

    res.json({
      success: true,
      message: 'Transaction marked as delivered',
      data: {
        transactionId,
        status: 'DELIVERED',
      },
    });
  } catch (error) {
    console.error('Mark delivered error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'MARK_DELIVERED_ERROR',
    });
  }
});

/**
 * POST /api/transactions/:id/confirm-delivery
 * Confirm delivery and release escrow (requires QR signature)
 */
router.post('/:id/confirm-delivery', verifyTokenMiddleware, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { qrSignature } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!qrSignature) {
      return res.status(400).json({
        success: false,
        message: 'qrSignature is required',
        error: 'MISSING_QR_SIGNATURE',
      });
    }

    // Verify transaction belongs to user (buyer or seller)
    await verifyTransactionOwnership(transactionId, userId);

    // Call transaction service to release escrow
    const result = await releaseEscrow(transactionId, qrSignature);

    res.json({
      success: true,
      message: 'Delivery confirmed and payment released',
      data: result,
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }

    if (error.message.includes('Invalid QR signature')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_QR_SIGNATURE',
      });
    }

    if (error.message.includes('status must be DELIVERED')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_STATUS',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'CONFIRM_DELIVERY_ERROR',
    });
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction details with logs
 */
router.get('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    // Verify user is buyer or seller
    await verifyTransactionOwnership(transactionId, userId);

    // Get transaction with related data
    const transaction = await Transaction.findById(transactionId)
      .populate('buyerId', 'email phone')
      .populate('sellerId', 'email phone')
      .populate('productId', 'name description price unit')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    // Get transaction logs
    const logs = await TransactionLog.find({ transactionId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction._id.toString(),
          amount: transaction.amount,
          fee: transaction.fee,
          totalAmount: transaction.totalAmount,
          quantity: transaction.quantity,
          status: transaction.status,
          escrowTransactionId: transaction.escrowTransactionId,
          qrSignature: transaction.qrSignature,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          settledAt: transaction.settledAt,
        },
        buyer: transaction.buyerId ? {
          id: transaction.buyerId._id.toString(),
          email: transaction.buyerId.email,
          phone: transaction.buyerId.phone,
        } : null,
        seller: transaction.sellerId ? {
          id: transaction.sellerId._id.toString(),
          email: transaction.sellerId.email,
          phone: transaction.sellerId.phone,
        } : null,
        product: transaction.productId ? {
          id: transaction.productId._id.toString(),
          name: transaction.productId.name,
          description: transaction.productId.description,
          price: transaction.productId.price,
          unit: transaction.productId.unit,
        } : null,
        logs: logs.map((log) => ({
          id: log._id.toString(),
          status: log.status,
          message: log.message,
          apiResponse: log.apiResponse,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_TRANSACTION_ERROR',
    });
  }
});

/**
 * POST /api/transactions/:id/dispute
 * Create dispute for transaction
 */
router.post('/:id/dispute', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { reason, description } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'reason is required',
        error: 'MISSING_REASON',
      });
    }

    // Verify user is buyer or seller
    const transaction = await verifyTransactionOwnership(transactionId, userId);

    // Check if transaction can be disputed (not settled or failed)
    if (transaction.status === 'SETTLED' || transaction.status === 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispute a transaction that is already settled or failed',
        error: 'INVALID_STATUS',
      });
    }

    // Update transaction status to indicate dispute
    transaction.status = 'FAILED';
    await transaction.save();

    // Log dispute
    await TransactionLog.create({
      transactionId: transaction._id,
      status: 'DISPUTE',
      message: `Dispute created: ${reason}`,
      apiResponse: {
        reason,
        description: description || null,
        raisedBy: userId,
        timestamp: new Date().toISOString(),
      },
    });

    // Notify admin (in a real system, you'd send email/notification)
    // For now, we'll just log it
    console.log(`DISPUTE ALERT: Transaction ${transactionId} disputed by user ${userId}. Reason: ${reason}`);

    // Get admin users to notify
    const admins = await User.find({ role: 'ADMIN' }).select('email phone');

    // In production, send notifications to admins
    // await Promise.all(admins.map(admin => sendNotification(admin.email, ...)));

    res.json({
      success: true,
      message: 'Dispute created and admin notified',
      data: {
        transactionId,
        status: 'FAILED',
        dispute: {
          reason,
          description,
          raisedBy: userId,
          createdAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Create dispute error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'DISPUTE_ERROR',
    });
  }
});

export default router;
