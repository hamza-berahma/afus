/**
 * Mock CIH API responses for testing
 */

export const mockCIHApi = {
  // Mock wallet balance response
  getWalletBalance: jest.fn().mockResolvedValue({
    balance: 10000,
    currency: 'MAD',
  }),

  // Mock insufficient balance
  getWalletBalanceInsufficient: jest.fn().mockResolvedValue({
    balance: 0,
    currency: 'MAD',
  }),

  // Mock simulate transfer response
  simulateTransfer: jest.fn().mockResolvedValue({
    totalAmountWithFee: 1050,
    frais: 50,
  }),

  // Mock execute transfer response
  executeTransfer: jest.fn().mockResolvedValue({
    transactionId: 'cih-tx-12345',
    reference: 'REF-12345',
  }),

  // Mock create merchant account response
  createMerchantAccount: jest.fn().mockResolvedValue({
    merchantId: 'merchant-123',
    walletId: 'wallet-123',
    contractId: 'contract-123',
  }),

  // Mock activate client account response
  activateClientAccount: jest.fn().mockResolvedValue({
    walletId: 'wallet-456',
    contractId: 'contract-456',
    status: 'activated',
  }),

  // Mock error responses
  networkError: jest.fn().mockRejectedValue({
    message: 'Network error',
    code: 'ECONNREFUSED',
  }),

  timeoutError: jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 100);
    });
  }),

  insufficientBalanceError: jest.fn().mockRejectedValue({
    response: {
      status: 400,
      data: {
        message: 'Insufficient balance',
      },
    },
  }),

  invalidCredentialsError: jest.fn().mockRejectedValue({
    response: {
      status: 401,
      data: {
        message: 'Invalid API credentials',
      },
    },
  }),
};

// Reset all mocks
export const resetCIHMocks = () => {
  Object.values(mockCIHApi).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
};

export default mockCIHApi;

