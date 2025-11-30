/**
 * Internal Payment API Service
 * 
 * This service provides a clean, internal payment system for Sou9na.
 * All wallets start with 1,000 MAD and transactions are processed internally.
 * 
 * This replaces the CIH Bank API for a cleaner payment flow.
 */

import crypto from 'crypto';

// In-memory wallet storage
const wallets = new Map();
const transactions = new Map();

// Default wallet balances (can be customized)
const DEFAULT_BALANCE = 1000; // 1,000 MAD

// Transaction fee calculation (simple percentage-based)
const TRANSACTION_FEE_PERCENTAGE = 0.02; // 2% fee
const MIN_FEE = 5; // Minimum 5 MAD
const MAX_FEE = 100; // Maximum 100 MAD

/**
 * Calculate transaction fee
 */
const calculateFee = (amount) => {
  const fee = Math.max(MIN_FEE, Math.min(MAX_FEE, amount * TRANSACTION_FEE_PERCENTAGE));
  return Math.round(fee * 100) / 100; // Round to 2 decimals
};

/**
 * Get or create wallet
 */
const getOrCreateWallet = (contractId) => {
  if (!wallets.has(contractId)) {
    wallets.set(contractId, {
      contractId,
      balance: DEFAULT_BALANCE,
      currency: 'MAD',
      createdAt: new Date(),
    });
    console.log(`[Payment API] Created wallet ${contractId} with balance ${DEFAULT_BALANCE} MAD`);
  }
  return wallets.get(contractId);
};

/**
 * Generate a mock transaction ID
 */
const generateTransactionId = () => {
  return `mock-tx-${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Generate a mock reference
 */
const generateReference = () => {
  return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (contractId) => {
  if (!contractId) {
    throw new Error('ContractId is required');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const wallet = getOrCreateWallet(contractId);
  
  console.log(`[Payment API] Get balance for ${contractId}: ${wallet.balance} ${wallet.currency}`);
  
  return {
    balance: wallet.balance,
    currency: wallet.currency,
  };
};

/**
 * Simulate transfer to calculate fees
 */
export const simulateTransfer = async (payload) => {
  const { ContractId, Amount, destinationPhone, RIB } = payload;

  if (!ContractId || !Amount || (!destinationPhone && !RIB)) {
    throw new Error('ContractId, Amount, and either destinationPhone or RIB are required');
  }

  if (Amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 150));

  const wallet = getOrCreateWallet(ContractId);
  
  // Check if wallet has sufficient balance
  const fee = calculateFee(Amount);
  const totalAmountWithFee = Amount + fee;

  if (wallet.balance < totalAmountWithFee) {
    throw new Error(`Insufficient balance. Available: ${wallet.balance} MAD, Required: ${totalAmountWithFee} MAD`);
  }

  console.log(`[Payment API] Simulate transfer: ${ContractId} -> ${destinationPhone || RIB}, Amount: ${Amount} MAD, Fee: ${fee} MAD`);

  return {
    totalAmountWithFee,
    frais: fee,
  };
};

/**
 * Execute transfer
 */
export const executeTransfer = async (payload) => {
  const { ContractId, Amount, destinationPhone, RIB } = payload;

  if (!ContractId || !Amount || (!destinationPhone && !RIB)) {
    throw new Error('ContractId, Amount, and either destinationPhone or RIB are required');
  }

  if (Amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const sourceWallet = getOrCreateWallet(ContractId);
  const destinationId = destinationPhone || RIB;
  const destinationWallet = getOrCreateWallet(destinationId);

  // Calculate fee
  const fee = calculateFee(Amount);
  const totalAmountWithFee = Amount + fee;

  // Check balance
  if (sourceWallet.balance < totalAmountWithFee) {
    throw new Error(`Insufficient balance. Available: ${sourceWallet.balance} MAD, Required: ${totalAmountWithFee} MAD`);
  }

  // Execute transfer
  sourceWallet.balance -= totalAmountWithFee;
  destinationWallet.balance += Amount; // Destination receives amount without fee

  // Create transaction record
  const transactionId = generateTransactionId();
  const reference = generateReference();
  
  transactions.set(transactionId, {
    transactionId,
    reference,
    sourceContractId: ContractId,
    destinationId,
    amount: Amount,
    fee,
    totalAmount: totalAmountWithFee,
    status: 'completed',
    timestamp: new Date(),
  });

  console.log(`[Payment API] Transfer executed: ${transactionId}`);
  console.log(`  From: ${ContractId} (Balance: ${sourceWallet.balance} MAD)`);
  console.log(`  To: ${destinationId} (Balance: ${destinationWallet.balance} MAD)`);
  console.log(`  Amount: ${Amount} MAD, Fee: ${fee} MAD`);

  return {
    transactionId,
    reference,
  };
};

/**
 * Create merchant account for cooperative
 */
export const createMerchantAccount = async (cooperativeData) => {
  const { name, registrationNumber, phone, email, region } = cooperativeData;

  if (!name || !registrationNumber || !phone || !email) {
    throw new Error('Name, registrationNumber, phone, and email are required');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Generate IDs
  const merchantId = `merchant-${crypto.randomBytes(4).toString('hex')}`;
  const walletId = `wallet-${crypto.randomBytes(4).toString('hex')}`;
  const contractId = `contract-${crypto.randomBytes(4).toString('hex')}`;

  // Create wallet for merchant
  getOrCreateWallet(contractId);

  console.log(`[Payment API] Created merchant account: ${merchantId}`);
  console.log(`  Wallet: ${walletId}, Contract: ${contractId} (Balance: ${DEFAULT_BALANCE} MAD)`);
  console.log(`  Name: ${name}, Phone: ${phone}`);

  return {
    merchantId,
    walletId,
    contractId,
  };
};

/**
 * Activate client account (buyer wallet)
 */
export const activateClientAccount = async (userData) => {
  const { phone, email, name } = userData;

  if (!phone || !email) {
    throw new Error('Phone and email are required');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 250));

  // Generate IDs (use phone as part of contract ID for consistency)
  const walletId = `wallet-${phone.replace(/\D/g, '').slice(-8)}`;
  const contractId = `contract-${crypto.randomBytes(4).toString('hex')}`;

  // Create wallet for client
  getOrCreateWallet(contractId);

  console.log(`[Payment API] Activated client account`);
  console.log(`  Wallet: ${walletId}, Contract: ${contractId} (Balance: ${DEFAULT_BALANCE} MAD)`);
  console.log(`  Phone: ${phone}, Email: ${email}`);

  return {
    walletId,
    contractId,
    status: 'activated',
  };
};

/**
 * Get all wallets (for debugging/admin)
 */
export const getAllWallets = () => {
  return Array.from(wallets.values());
};

/**
 * Get all transactions (for debugging/admin)
 */
export const getAllTransactions = () => {
  return Array.from(transactions.values());
};

/**
 * Reset all wallets and transactions (for testing)
 */
export const resetMockData = () => {
  wallets.clear();
  transactions.clear();
  console.log('[Payment API] All payment data reset');
};

/**
 * Set wallet balance (for testing)
 */
export const setWalletBalance = (contractId, balance) => {
  const wallet = getOrCreateWallet(contractId);
  wallet.balance = balance;
  console.log(`[Payment API] Set balance for ${contractId}: ${balance} MAD`);
};

const mockCihApi = {
  getWalletBalance,
  simulateTransfer,
  executeTransfer,
  createMerchantAccount,
  activateClientAccount,
  getAllWallets,
  getAllTransactions,
  resetMockData,
  setWalletBalance,
};

export default mockCihApi;

