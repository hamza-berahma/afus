import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../db/models/Product.js';
import User from '../db/models/User.js';
import Cooperative from '../db/models/Cooperative.js';
import Transaction from '../db/models/Transaction.js';
import TransactionLog from '../db/models/TransactionLog.js';
import bankingService from './banking/index.js';
import { apiConfig } from '../config/api.js';

// Twilio SMS helper (simple implementation)
const sendSMS = async (phone, message) => {
  if (!apiConfig.twilio.accountSid || !apiConfig.twilio.authToken) {
    console.warn('Twilio not configured, skipping SMS:', { phone, message });
    return;
  }

  try {
    // Dynamic import for Twilio (optional dependency)
    const twilio = await import('twilio');
    const client = twilio.default(apiConfig.twilio.accountSid, apiConfig.twilio.authToken);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '', // Add to .env
      to: phone,
    });

    console.log(`SMS sent to ${phone}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't throw - SMS failure shouldn't break the transaction
  }
};

/**
 * Simulate transaction to calculate costs
 * @param {string} buyerId - Buyer user ID
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to purchase
 * @returns {Promise<{productCost: number, fee: number, totalCost: number}>}
 */
export const simulateTransaction = async (buyerId, productId, quantity) => {
  if (!buyerId || !productId || !quantity || quantity <= 0) {
    throw new Error('buyerId, productId, and positive quantity are required');
  }

  // Fetch product details
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  // Check stock availability
  if (product.stockQuantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`);
  }

  // Calculate product cost
  const productCost = product.price * quantity;

  // Get buyer's wallet_id
  const buyer = await User.findById(buyerId).select('walletId');

  if (!buyer) {
    throw new Error('Buyer not found');
  }

  if (!buyer.walletId) {
    throw new Error('Buyer wallet not activated');
  }

  // Get holding wallet ID from config (escrow wallet)
  const holdingWalletId = apiConfig.cih?.holdingWalletId || 'ESCROW_WALLET';
  
  // Call banking service to simulate transfer
  const simulationResult = await bankingService.simulateTransfer({
    ContractId: buyer.walletId,
    Amount: productCost,
    destinationPhone: holdingWalletId, // Using holding wallet as destination
  });

  const fee = simulationResult.frais || 0;
  const totalCost = simulationResult.totalAmountWithFee || (productCost + fee);

  return {
    productCost,
    fee,
    totalCost,
  };
};

/**
 * Create escrow transaction
 * @param {string} buyerId - Buyer user ID
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to purchase
 * @param {Object} simulatedData - Result from simulateTransaction
 * @returns {Promise<Object>} Transaction details
 */
export const createEscrowTransaction = async (buyerId, productId, quantity, simulatedData) => {
  if (!buyerId || !productId || !quantity || !simulatedData) {
    throw new Error('buyerId, productId, quantity, and simulatedData are required');
  }

  const { productCost, fee, totalCost } = simulatedData;

  // Use MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch product and seller details
    const product = await Product.findById(productId)
      .populate({
        path: 'cooperativeId',
        select: 'userId',
        model: 'Cooperative',
      })
      .session(session);

    if (!product) {
      throw new Error('Product not found');
    }

    const sellerId = product.cooperativeId?.userId;
    if (!sellerId) {
      throw new Error('Seller not found');
    }

    // Get buyer's wallet details
    const buyer = await User.findById(buyerId).select('walletId phone email').session(session);

    if (!buyer) {
      throw new Error('Buyer not found');
    }

    if (!buyer.walletId) {
      throw new Error('Buyer wallet not activated');
    }

    // Get seller's details
    const seller = await User.findById(sellerId).select('phone email').session(session);

    if (!seller) {
      throw new Error('Seller not found');
    }

    // Get holding wallet ID from config (escrow wallet)
    const holdingWalletId = apiConfig.cih?.holdingWalletId || 'ESCROW_WALLET';

    // Create transaction record (status: INITIATED)
    const transactionRecord = await Transaction.create([{
      buyerId,
      sellerId,
      productId,
      quantity,
      amount: productCost,
      fee,
      totalAmount: totalCost,
      status: 'INITIATED',
    }], { session });

    const transaction = transactionRecord[0];
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }
    
    const transactionId = transaction._id.toString();

    // Log transaction creation
    await TransactionLog.create([{
      transactionId: transaction._id,
      status: 'INITIATED',
      message: 'Transaction created',
      apiResponse: { productCost, fee, totalCost },
    }], { session });

    // Call banking service to execute transfer (buyer → holding wallet)
    const transferResult = await bankingService.executeTransfer({
      ContractId: buyer.walletId,
      Amount: totalCost,
      destinationPhone: holdingWalletId,
    });

    // Update transaction (status: ESCROWED, escrow_transaction_id)
    transaction.status = 'ESCROWED';
    transaction.escrowTransactionId = transferResult.transactionId || transferResult.reference;
    await transaction.save({ session });

    // Decrement product stock
    product.stockQuantity -= quantity;
    await product.save({ session });

    // Log escrow creation
    await TransactionLog.create([{
      transactionId: transaction._id,
      status: 'ESCROWED',
      message: 'Funds escrowed',
      apiResponse: transferResult,
    }], { session });

    // Send SMS to producer
    const smsMessage = `New order received! Transaction ID: ${transactionId}, Amount: ${totalCost} MAD, Quantity: ${quantity}`;
    await sendSMS(seller.phone, smsMessage);

    // Commit transaction
    await session.commitTransaction();

    return {
      transactionId,
      status: 'ESCROWED',
      escrowTransactionId: transferResult.transactionId || transferResult.reference,
      amount: productCost,
      fee,
      totalAmount: totalCost,
      createdAt: transaction.createdAt,
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Release escrow funds to seller
 * @param {string} transactionId - Transaction ID
 * @param {string} qrSignature - QR signature for verification
 * @returns {Promise<Object>} Success response
 */
export const releaseEscrow = async (transactionId, qrSignature) => {
  if (!transactionId || !qrSignature) {
    throw new Error('transactionId and qrSignature are required');
  }

  // Use MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get transaction details with seller info (within session to avoid race conditions)
    const tx = await Transaction.findById(transactionId)
      .populate('sellerId', 'walletId phone')
      .populate('buyerId', 'phone email')
      .session(session);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    // Verify QR signature
    // Note: We use created_at timestamp for verification since QR is generated at transaction creation
    const transactionTimestamp = new Date(tx.createdAt).getTime();
    const isValidSignature = verifyQRSignature(
      {
        transaction_id: transactionId,
        amount: tx.totalAmount,
        timestamp: transactionTimestamp,
      },
      qrSignature
    );

    if (!isValidSignature) {
      throw new Error('Invalid QR signature');
    }

    // Check transaction status is DELIVERED
    if (tx.status !== 'DELIVERED') {
      throw new Error(`Transaction status must be DELIVERED. Current status: ${tx.status}`);
    }

    if (!tx.sellerId || !tx.sellerId.walletId) {
      throw new Error('Seller wallet not activated');
    }

    if (!tx.buyerId || !tx.buyerId.phone) {
      throw new Error('Buyer information not found');
    }

    // Get buyer's wallet ID
    const buyer = await User.findById(tx.buyerId._id).select('walletId').session(session);
    if (!buyer || !buyer.walletId) {
      throw new Error('Buyer wallet not found');
    }

    // Use banking service's releaseEscrow method to transfer from buyer to seller
    // Note: In a real escrow system, funds would be held in an escrow wallet
    // For now, we'll use the releaseEscrow method which handles the transfer
    const escrowResult = await bankingService.releaseEscrow({
      buyerId: buyer.walletId,
      sellerId: tx.sellerId.walletId,
      amount: tx.totalAmount,
      transactionId: transactionId,
    });

    // Update transaction (status: SETTLED, settled_at)
    tx.status = 'SETTLED';
    tx.settledAt = new Date();
    await tx.save({ session });

    // Log settlement
    await TransactionLog.create([{
      transactionId: tx._id,
      status: 'SETTLED',
      message: 'Funds released to seller',
      apiResponse: escrowResult,
    }], { session });

    // Send SMS to both parties
    const sellerMessage = `Payment received! Transaction ${transactionId} settled. Amount: ${tx.totalAmount} MAD`;
    const buyerMessage = `Transaction ${transactionId} completed and payment released to seller.`;

    const smsPromises = [];
    if (tx.sellerId && tx.sellerId.phone) {
      smsPromises.push(sendSMS(tx.sellerId.phone, sellerMessage));
    }
    if (tx.buyerId && tx.buyerId.phone) {
      smsPromises.push(sendSMS(tx.buyerId.phone, buyerMessage));
    }
    
    if (smsPromises.length > 0) {
      await Promise.all(smsPromises);
    }

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      transactionId,
      status: 'SETTLED',
      settledAt: new Date(),
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Generate QR signature for transaction
 * @param {string} transactionId - Transaction ID
 * @param {number} amount - Transaction amount
 * @param {number} timestamp - Optional timestamp (defaults to current time)
 * @returns {string} HMAC-SHA256 signature
 */
export const generateQRSignature = (transactionId, amount, timestamp = null) => {
  if (!transactionId || !amount) {
    throw new Error('transactionId and amount are required');
  }

  const ts = timestamp || Date.now();
  const payload = {
    transaction_id: transactionId,
    amount: amount,
    timestamp: ts,
  };

  // Create payload string (sorted keys for consistency)
  const payloadString = JSON.stringify(payload);

  // Generate HMAC-SHA256 hash using JWT_SECRET
  const secret = apiConfig.jwt.secret;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  return signature;
};

/**
 * Verify QR signature
 * @param {Object} payload - Payload object { transaction_id, amount, timestamp }
 * @param {string} signature - Signature to verify
 * @returns {boolean} True if signature is valid
 */
export const verifyQRSignature = (payload, signature) => {
  if (!payload || !signature) {
    return false;
  }

  try {
    // Regenerate HMAC from payload
    const payloadString = JSON.stringify(payload);
    const secret = apiConfig.jwt.secret;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Compare signatures (constant-time comparison)
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let isValid = true;
    for (let i = 0; i < signature.length; i++) {
      isValid &= signature[i] === expectedSignature[i];
    }

    if (!isValid) {
      return false;
    }

    // Check timestamp is within 24 hours
    if (payload.timestamp) {
      const timestamp = parseInt(payload.timestamp);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (now - timestamp > twentyFourHours) {
        return false; // Signature expired
      }
    }

    return true;
  } catch (error) {
    console.error('Error verifying QR signature:', error);
    return false;
  }
};
