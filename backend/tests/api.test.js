import request from 'supertest';
import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import app from '../server.js';
import { User, Cooperative, Product } from '../db/models/index.js';
import { hashPassword } from '../middleware/auth.js';

// Mock CIH API functions
const mockGetWalletBalance = jest.fn();
const mockSimulateTransfer = jest.fn();
const mockExecuteTransfer = jest.fn();
const mockCreateMerchantAccount = jest.fn();
const mockActivateClientAccount = jest.fn();

jest.unstable_mockModule('../services/cihApi.js', () => ({
  getWalletBalance: (...args) => mockGetWalletBalance(...args),
  simulateTransfer: (...args) => mockSimulateTransfer(...args),
  executeTransfer: (...args) => mockExecuteTransfer(...args),
  createMerchantAccount: (...args) => mockCreateMerchantAccount(...args),
  activateClientAccount: (...args) => mockActivateClientAccount(...args),
  CIHApiError: class CIHApiError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  InsufficientBalanceError: class InsufficientBalanceError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 400;
    }
  },
  InvalidCredentialsError: class InvalidCredentialsError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 401;
    }
  },
}));

// Mock notification service
jest.unstable_mockModule('../services/notificationService.js', () => ({
  sendOrderNotification: jest.fn().mockResolvedValue(true),
  sendShippingNotification: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
  sendDeliveryReminder: jest.fn().mockResolvedValue(true),
}));

describe('API Tests', () => {
  let testUser;
  let testBuyer;
  let testProducer;
  let testCooperative;
  let testProduct;
  let authToken;
  let buyerToken;
  let producerToken;

  // Setup test data
  beforeEach(async () => {
    // Reset all mocks
    mockGetWalletBalance.mockClear();
    mockSimulateTransfer.mockClear();
    mockExecuteTransfer.mockClear();
    mockCreateMerchantAccount.mockClear();
    mockActivateClientAccount.mockClear();

    // Set default mock implementations
    mockGetWalletBalance.mockResolvedValue({ balance: 10000, currency: 'MAD' });
    mockSimulateTransfer.mockResolvedValue({ totalAmountWithFee: 1050, frais: 50 });
    mockExecuteTransfer.mockResolvedValue({ transactionId: 'cih-tx-123', reference: 'REF-123' });
    mockCreateMerchantAccount.mockResolvedValue({ merchantId: 'merchant-123', walletId: 'wallet-123' });
    mockActivateClientAccount.mockResolvedValue({ walletId: 'wallet-456', contractId: 'contract-456' });

    // Create test users using MongoDB
    const buyerPassword = await hashPassword('testpass123');
    const producerPassword = await hashPassword('testpass123');

    testBuyer = await User.create({
      email: 'buyer@test.com',
      phone: '+212612345678',
      passwordHash: buyerPassword,
      role: 'BUYER',
    });

    testProducer = await User.create({
      email: 'producer@test.com',
      phone: '+212612345679',
      passwordHash: producerPassword,
      role: 'PRODUCER',
    });

    // Create cooperative for producer
    testCooperative = await Cooperative.create({
      name: 'Test Cooperative',
      userId: testProducer._id,
      registrationNumber: 'REG123',
      region: 'North',
    });

    // Create test product
    testProduct = await Product.create({
      cooperativeId: testCooperative._id,
      name: 'Test Wheat',
      description: 'Test description',
      price: 50.00,
      unit: 'kg',
      stockQuantity: 100,
    });

    // Get auth tokens by logging in
    const buyerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'testpass123' });
    buyerToken = buyerLogin.body.data?.accessToken;

    const producerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'producer@test.com', password: 'testpass123' });
    producerToken = producerLogin.body.data?.accessToken;
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'newuser@test.com',
            phone: '+212612345680',
            password: 'SecurePass123',
            role: 'BUYER',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe('newuser@test.com');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
      });

      it('should reject duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'buyer@test.com',
            phone: '+212612345681',
            password: 'SecurePass123',
            role: 'BUYER',
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'incomplete@test.com',
            // Missing required fields
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'buyer@test.com',
            password: 'testpass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user.email).toBe('buyer@test.com');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'buyer@test.com',
            password: 'wrongpassword',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should login with phone number', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phone: '+212612345678',
            password: 'testpass123',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should refresh access token', async () => {
        // First login to get refresh token
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'buyer@test.com',
            password: 'testpass123',
          });

        const refreshToken = loginResponse.body.data.refreshToken;

        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
      });

      it('should reject invalid refresh token', async () => {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: 'invalid-token' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Wallet Operations', () => {
    describe('GET /api/wallet/balance', () => {
      it('should get wallet balance', async () => {
        // Activate wallet first
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValueOnce({
          balance: 5000,
          currency: 'MAD',
        });

        const response = await request(app)
          .get('/api/wallet/balance')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('balance');
        expect(response.body.data).toHaveProperty('currency');
        expect(mockGetWalletBalance).toHaveBeenCalledWith('wallet-123');
      });

      it('should handle insufficient balance', async () => {
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValueOnce({
          balance: 0,
          currency: 'MAD',
        });

        const response = await request(app)
          .get('/api/wallet/balance')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.balance).toBe(0);
      });

      it('should require authentication', async () => {
        const response = await request(app).get('/api/wallet/balance');

        expect(response.status).toBe(401);
      });

      it('should return error if wallet not activated', async () => {
        const response = await request(app)
          .get('/api/wallet/balance')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('WALLET_NOT_ACTIVATED');
      });
    });
  });

  describe('Transaction Flow', () => {
    describe('POST /api/transactions/simulate', () => {
      it('should simulate transaction and calculate fees', async () => {
        mockSimulateTransfer.mockResolvedValueOnce({
          totalAmountWithFee: 1050,
          frais: 50,
        });

        const response = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('productCost');
        expect(response.body.data).toHaveProperty('fee');
        expect(response.body.data).toHaveProperty('totalCost');
        expect(response.body.data.productCost).toBe(500); // 50 * 10
        expect(response.body.data.fee).toBe(50);
        expect(response.body.data.totalCost).toBe(1050);
      });

      it('should validate quantity', async () => {
        const response = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: -1,
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('INVALID_QUANTITY');
      });

      it('should require BUYER role', async () => {
        const response = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${producerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
          });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/transactions/create', () => {
      it('should create escrow transaction', async () => {
        // Setup: Activate buyer wallet
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });

        // Mock balance check
        mockGetWalletBalance.mockResolvedValueOnce({
          balance: 10000,
          currency: 'MAD',
        });

        // Mock simulate
        mockSimulateTransfer.mockResolvedValueOnce({
          totalAmountWithFee: 1050,
          frais: 50,
        });

        // Mock execute transfer
        mockExecuteTransfer.mockResolvedValueOnce({
          transactionId: 'cih-tx-123',
          reference: 'REF-123',
        });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
          });

        const response = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('transactionId');
        expect(response.body.data.status).toBe('ESCROWED');
      });

      it('should reject if insufficient balance', async () => {
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValueOnce({
          balance: 10,
          currency: 'MAD',
        });

        mockSimulateTransfer.mockResolvedValueOnce({
          totalAmountWithFee: 1050,
          frais: 50,
        });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
          });

        const response = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('INSUFFICIENT_BALANCE');
      });
    });

    describe('POST /api/transactions/:id/ship', () => {
      it('should mark transaction as shipped and generate QR', async () => {
        // Create transaction first
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValueOnce({
          balance: 10000,
        });
        mockSimulateTransfer.mockResolvedValueOnce({
          totalAmountWithFee: 1050,
          frais: 50,
        });
        mockExecuteTransfer.mockResolvedValueOnce({
          transactionId: 'cih-tx-123',
        });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ productId: testProduct._id.toString(), quantity: 10 });

        const createResponse = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        const transactionId = createResponse.body.data.transactionId;

        // Ship transaction
        const response = await request(app)
          .post(`/api/transactions/${transactionId}/ship`)
          .set('Authorization', `Bearer ${producerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('SHIPPED');
        expect(response.body.data.qrCode).toHaveProperty('payload');
        expect(response.body.data.qrCode).toHaveProperty('signature');
      });

      it('should only allow producer to ship', async () => {
        // Create a transaction first
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValueOnce({ balance: 10000 });
        mockSimulateTransfer.mockResolvedValueOnce({ totalAmountWithFee: 1050, frais: 50 });
        mockExecuteTransfer.mockResolvedValueOnce({ transactionId: 'cih-tx-123' });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ productId: testProduct._id.toString(), quantity: 10 });

        const createResponse = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        const transactionId = createResponse.body.data.transactionId;

        // Try to ship as buyer (should fail)
        const response = await request(app)
          .post(`/api/transactions/${transactionId}/ship`)
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/transactions/:id/confirm-delivery', () => {
      it('should confirm delivery and release escrow', async () => {
        // Create and ship a transaction first
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });
        await User.findByIdAndUpdate(testProducer._id, {
          $set: { walletId: 'producer-wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValue({ balance: 10000 });
        mockSimulateTransfer.mockResolvedValue({ totalAmountWithFee: 1050, frais: 50 });
        mockExecuteTransfer
          .mockResolvedValueOnce({ transactionId: 'cih-escrow-123' }) // For escrow
          .mockResolvedValueOnce({ transactionId: 'cih-release-123' }); // For release

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ productId: testProduct._id.toString(), quantity: 10 });

        const createResponse = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        const transactionId = createResponse.body.data.transactionId;

        // Ship transaction
        const shipResponse = await request(app)
          .post(`/api/transactions/${transactionId}/ship`)
          .set('Authorization', `Bearer ${producerToken}`);

        const qrSignature = shipResponse.body.data.qrCode.signature;

        // Confirm delivery
        const response = await request(app)
          .post(`/api/transactions/${transactionId}/confirm-delivery`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ qrSignature });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('End-to-End Transaction Flow', () => {
      it('should complete full transaction lifecycle', async () => {
        // 1. Activate wallets
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet' },
        });
        await User.findByIdAndUpdate(testProducer._id, {
          $set: { walletId: 'producer-wallet' },
        });

        // 2. Simulate transaction
        mockGetWalletBalance.mockResolvedValue({ balance: 10000 });
        mockSimulateTransfer.mockResolvedValue({
          totalAmountWithFee: 1050,
          frais: 50,
        });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ productId: testProduct._id.toString(), quantity: 10 });

        expect(simulateResponse.status).toBe(200);

        // 3. Create transaction
        mockExecuteTransfer.mockResolvedValue({
          transactionId: 'cih-escrow-123',
        });

        const createResponse = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        const transactionId = createResponse.body.data.transactionId;
        expect(createResponse.status).toBe(201);
        expect(createResponse.body.data.status).toBe('ESCROWED');

        // 4. Ship transaction
        const shipResponse = await request(app)
          .post(`/api/transactions/${transactionId}/ship`)
          .set('Authorization', `Bearer ${producerToken}`);

        expect(shipResponse.status).toBe(200);
        expect(shipResponse.body.data.status).toBe('SHIPPED');
        expect(shipResponse.body.data.qrCode).toBeDefined();
      });
    });
  });

  describe('Error Scenarios', () => {
    describe('API Timeout', () => {
      it('should handle CIH API timeout', async () => {
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'wallet-123' },
        });

        mockGetWalletBalance.mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        });

        const response = await request(app)
          .get('/api/wallet/balance')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBeGreaterThanOrEqual(500);
      });
    });

    describe('Invalid Transaction ID', () => {
      it('should return 404 for non-existent transaction', async () => {
        const fakeId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format
        const response = await request(app)
          .get(`/api/transactions/${fakeId}`)
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('Duplicate Confirmation', () => {
      it('should prevent duplicate delivery confirmation', async () => {
        // Create and ship a transaction
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'buyer-wallet-123' },
        });
        await User.findByIdAndUpdate(testProducer._id, {
          $set: { walletId: 'producer-wallet-123' },
        });

        mockGetWalletBalance.mockResolvedValue({ balance: 10000 });
        mockSimulateTransfer.mockResolvedValue({ totalAmountWithFee: 1050, frais: 50 });
        mockExecuteTransfer
          .mockResolvedValueOnce({ transactionId: 'cih-escrow-123' })
          .mockResolvedValueOnce({ transactionId: 'cih-release-123' });

        const simulateResponse = await request(app)
          .post('/api/transactions/simulate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ productId: testProduct._id.toString(), quantity: 10 });

        const createResponse = await request(app)
          .post('/api/transactions/create')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            productId: testProduct._id.toString(),
            quantity: 10,
            simulatedFee: simulateResponse.body.data.fee,
          });

        const transactionId = createResponse.body.data.transactionId;

        const shipResponse = await request(app)
          .post(`/api/transactions/${transactionId}/ship`)
          .set('Authorization', `Bearer ${producerToken}`);

        const qrSignature = shipResponse.body.data.qrCode.signature;

        // First confirmation should succeed
        const response1 = await request(app)
          .post(`/api/transactions/${transactionId}/confirm-delivery`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ qrSignature });

        expect(response1.status).toBe(200);

        // Second confirmation should fail
        const response2 = await request(app)
          .post(`/api/transactions/${transactionId}/confirm-delivery`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ qrSignature });

        expect(response2.status).toBe(400);
        expect(response2.body.error).toBe('INVALID_STATUS');
      });
    });

    describe('Network Errors', () => {
      it('should handle network errors gracefully', async () => {
        await User.findByIdAndUpdate(testBuyer._id, {
          $set: { walletId: 'wallet-123' },
        });

        mockGetWalletBalance.mockRejectedValueOnce({
          message: 'Network error',
          code: 'ECONNREFUSED',
        });

        const response = await request(app)
          .get('/api/wallet/balance')
          .set('Authorization', `Bearer ${buyerToken}`);

        expect(response.status).toBeGreaterThanOrEqual(500);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
