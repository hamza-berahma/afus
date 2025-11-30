import axios from 'axios';
import { apiConfig } from '../config/api.js';

// Always use mock API (CIH API disabled)
const USE_MOCK_API = true;

// Lazy load mock API when needed
let mockCihApiPromise = null;
const getMockCihApi = async () => {
  if (!mockCihApiPromise) {
    if (USE_MOCK_API) {
      console.log('⚠️  [CIH API] Using MOCK API mode (USE_MOCK_CIH_API=true or CIH_API_BASE_URL not set)');
    }
    mockCihApiPromise = import('./mockCihApi.js');
  }
  return mockCihApiPromise;
};

// Custom Error Classes
export class CIHApiError extends Error {
  constructor(message, statusCode, responseData = null) {
    super(message);
    this.name = 'CIHApiError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientBalanceError extends CIHApiError {
  constructor(message = 'Insufficient balance', responseData = null) {
    super(message, 400, responseData);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidCredentialsError extends CIHApiError {
  constructor(message = 'Invalid CIH API credentials', responseData = null) {
    super(message, 401, responseData);
    this.name = 'InvalidCredentialsError';
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (attempt) => {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
const isRetryableError = (error) => {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }
  
  const statusCode = error.response.status;
  // Retry on 5xx errors and 429 (Too Many Requests)
  return statusCode >= 500 || statusCode === 429;
};

/**
 * Execute request with retry logic
 * @param {Function} requestFn - Function that returns a promise
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<any>} Response data
 */
const executeWithRetry = async (requestFn, retries = MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === retries || !isRetryableError(error)) {
        throw error;
      }
      
      // Calculate delay and wait before retrying
      const delay = getRetryDelay(attempt);
      console.warn(`CIH API request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Create axios instance with base configuration
const cihApi = axios.create({
  baseURL: apiConfig.cih.baseUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiConfig.cih.apiKey,
  },
});

// Request interceptor for logging
cihApi.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CIH API] ${config.method.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      });
    }
    return config;
  },
  (error) => {
    console.error('[CIH API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
cihApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CIH API] Response ${response.status} ${response.config.url}`, {
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    const errorMessage = error.response
      ? `[CIH API] Error ${error.response.status} ${error.config?.url}: ${error.response.data?.message || error.message}`
      : `[CIH API] Network error: ${error.message}`;
    
    console.error(errorMessage, {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    
    return Promise.reject(error);
  }
);

/**
 * Handle API errors and throw appropriate custom errors
 * @param {Error} error - Axios error
 * @throws {CIHApiError|InsufficientBalanceError|InvalidCredentialsError}
 */
const handleApiError = (error) => {
  if (!error.response) {
    throw new CIHApiError(
      `Network error: ${error.message}`,
      0,
      { networkError: true }
    );
  }
  
  const { status, data } = error.response;
  const errorMessage = data?.message || data?.error || error.message || 'CIH API error';
  
  // Handle specific error cases
  if (status === 401 || status === 403) {
    throw new InvalidCredentialsError(errorMessage, data);
  }
  
  if (status === 400 && (errorMessage.toLowerCase().includes('balance') || 
                         errorMessage.toLowerCase().includes('insufficient'))) {
    throw new InsufficientBalanceError(errorMessage, data);
  }
  
  throw new CIHApiError(errorMessage, status, data);
};

/**
 * Get wallet balance
 * @param {string} contractId - CIH contract/wallet ID
 * @returns {Promise<{balance: number, currency: string}>}
 */
export const getWalletBalance = async (contractId) => {
  if (!contractId) {
    throw new CIHApiError('ContractId is required', 400);
  }

  // Use mock API if enabled
  if (USE_MOCK_API) {
    try {
      const mockApi = await getMockCihApi();
      return await mockApi.default.getWalletBalance(contractId);
    } catch (error) {
      if (error.message.includes('Insufficient balance')) {
        throw new InsufficientBalanceError(error.message);
      }
      throw new CIHApiError(error.message, 400);
    }
  }
  
  try {
    const response = await executeWithRetry(() =>
      cihApi.get('/wallet/balance', {
        params: { ContractId: contractId },
      })
    );
    
    return {
      balance: response.data.balance || response.data.Balance || 0,
      currency: response.data.currency || response.data.Currency || 'MAD',
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Simulate transfer to calculate fees
 * @param {Object} payload - Transfer simulation payload
 * @param {string} payload.ContractId - Source contract ID
 * @param {number} payload.Amount - Transfer amount
 * @param {string} payload.destinationPhone - Destination phone number
 * @param {string} payload.RIB - Bank account RIB
 * @returns {Promise<{totalAmountWithFee: number, frais: number}>}
 */
export const simulateTransfer = async (payload) => {
  const { ContractId, Amount, destinationPhone, RIB } = payload;
  
  if (!ContractId || !Amount || (!destinationPhone && !RIB)) {
    throw new CIHApiError('ContractId, Amount, and either destinationPhone or RIB are required', 400);
  }

  // Use mock API if enabled
  if (USE_MOCK_API) {
    try {
      const mockApi = await getMockCihApi();
      return await mockApi.default.simulateTransfer(payload);
    } catch (error) {
      if (error.message.includes('Insufficient balance')) {
        throw new InsufficientBalanceError(error.message);
      }
      throw new CIHApiError(error.message, 400);
    }
  }
  
  try {
    const requestPayload = {
      ContractId,
      Amount,
      step: 'simulation',
    };
    
    if (destinationPhone) {
      requestPayload.destinationPhone = destinationPhone;
    }
    if (RIB) {
      requestPayload.RIB = RIB;
    }
    
    const response = await executeWithRetry(() =>
      cihApi.post('/wallet/transfer/virement', requestPayload)
    );
    
    return {
      totalAmountWithFee: response.data.totalAmountWithFee || response.data.TotalAmountWithFee || 0,
      frais: response.data.frais || response.data.Frais || 0,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Execute transfer
 * @param {Object} payload - Transfer payload
 * @param {string} payload.ContractId - Source contract ID
 * @param {number} payload.Amount - Transfer amount
 * @param {string} payload.destinationPhone - Destination phone number
 * @param {string} payload.RIB - Bank account RIB
 * @returns {Promise<{transactionId: string, reference: string}>}
 */
export const executeTransfer = async (payload) => {
  const { ContractId, Amount, destinationPhone, RIB } = payload;
  
  if (!ContractId || !Amount || (!destinationPhone && !RIB)) {
    throw new CIHApiError('ContractId, Amount, and either destinationPhone or RIB are required', 400);
  }

  // Use mock API if enabled
  if (USE_MOCK_API) {
    try {
      const mockApi = await getMockCihApi();
      return await mockApi.default.executeTransfer(payload);
    } catch (error) {
      if (error.message.includes('Insufficient balance')) {
        throw new InsufficientBalanceError(error.message);
      }
      throw new CIHApiError(error.message, 400);
    }
  }
  
  try {
    const requestPayload = {
      ContractId,
      Amount,
    };
    
    if (destinationPhone) {
      requestPayload.destinationPhone = destinationPhone;
    }
    if (RIB) {
      requestPayload.RIB = RIB;
    }
    
    const response = await executeWithRetry(() =>
      cihApi.post('/wallet/transfer/virement', requestPayload)
    );
    
    return {
      transactionId: response.data.transactionId || response.data.TransactionId || response.data.id,
      reference: response.data.reference || response.data.Reference || response.data.transactionId,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create merchant account for cooperative
 * @param {Object} cooperativeData - Cooperative data
 * @param {string} cooperativeData.name - Cooperative name
 * @param {string} cooperativeData.registrationNumber - Registration number
 * @param {string} cooperativeData.phone - Contact phone
 * @param {string} cooperativeData.email - Contact email
 * @param {string} cooperativeData.region - Region
 * @returns {Promise<{merchantId: string, walletId: string, contractId: string}>}
 */
export const createMerchantAccount = async (cooperativeData) => {
  const { name, registrationNumber, phone, email, region } = cooperativeData;
  
  if (!name || !registrationNumber || !phone || !email) {
    throw new CIHApiError('Name, registrationNumber, phone, and email are required', 400);
  }

  // Use mock API if enabled
  if (USE_MOCK_API) {
    try {
      const mockApi = await getMockCihApi();
      return await mockApi.default.createMerchantAccount(cooperativeData);
    } catch (error) {
      throw new CIHApiError(error.message, 400);
    }
  }
  
  try {
    const requestPayload = {
      name,
      registrationNumber,
      phone,
      email,
      ...(region && { region }),
    };
    
    const response = await executeWithRetry(() =>
      cihApi.post('/merchant/creation', requestPayload)
    );
    
    return {
      merchantId: response.data.merchantId || response.data.MerchantId || response.data.id,
      walletId: response.data.walletId || response.data.WalletId || response.data.wallet_id,
      contractId: response.data.contractId || response.data.ContractId || response.data.contract_id,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Activate client account (buyer wallet)
 * @param {Object} userData - User data
 * @param {string} userData.phone - User phone number
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @returns {Promise<{walletId: string, contractId: string, status: string}>}
 */
export const activateClientAccount = async (userData) => {
  const { phone, email, name } = userData;
  
  if (!phone || !email) {
    throw new CIHApiError('Phone and email are required', 400);
  }

  // Use mock API if enabled
  if (USE_MOCK_API) {
    try {
      const mockApi = await getMockCihApi();
      return await mockApi.default.activateClientAccount(userData);
    } catch (error) {
      throw new CIHApiError(error.message, 400);
    }
  }
  
  try {
    const requestPayload = {
      phone,
      email,
      ...(name && { name }),
    };
    
    const response = await executeWithRetry(() =>
      cihApi.post('/activate-client-account', requestPayload)
    );
    
    return {
      walletId: response.data.walletId || response.data.WalletId || response.data.wallet_id,
      contractId: response.data.contractId || response.data.ContractId || response.data.contract_id,
      status: response.data.status || response.data.Status || 'activated',
    };
  } catch (error) {
    handleApiError(error);
  }
};

export default cihApi;

