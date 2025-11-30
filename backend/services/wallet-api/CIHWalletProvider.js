/**
 * CIH Live Wallet API Provider
 * 
 * Production implementation using real CIH Bank Wallet APIs.
 * Handles all HTTP requests, retries, and error scenarios.
 */

import axios from 'axios';
import {
  WalletAPIError,
  ValidationError,
  InvalidOTPError,
  InsufficientBalanceError,
  ContractNotFoundError,
  TransactionFailedError,
} from './types.js';
import { formatSuccessResponse } from './utils/formatters.js';

export class CIHWalletProvider {
  #api;
  #config;
  #MAX_RETRIES = 3;
  #INITIAL_RETRY_DELAY = 1000;

  constructor(config = {}) {
    this.#config = {
      baseUrl: config.baseUrl || process.env.CIH_WALLET_API_BASE_URL || '',
      apiKey: config.apiKey || process.env.CIH_WALLET_API_KEY || '',
      timeout: config.timeout || 30000,
      enableLogging: config.enableLogging ?? process.env.NODE_ENV === 'development',
    };

    if (!this.#config.baseUrl) {
      throw new Error('CIH_WALLET_API_BASE_URL is required for live provider');
    }

    if (!this.#config.apiKey) {
      throw new Error('CIH_WALLET_API_KEY is required for live provider');
    }

    this.#api = axios.create({
      baseURL: this.#config.baseUrl,
      timeout: this.#config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.#config.apiKey,
      },
    });

    // Request interceptor
    this.#api.interceptors.request.use(
      (config) => {
        if (this.#config.enableLogging) {
          console.log(`[🏦 CIH WALLET] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('[🏦 CIH WALLET] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.#api.interceptors.response.use(
      (response) => {
        if (this.#config.enableLogging) {
          console.log(`[🏦 CIH WALLET] ✅ ${response.status} ${response.config?.url}`);
        }
        return response;
      },
      (error) => {
        if (this.#config.enableLogging) {
          console.error(`[🏦 CIH WALLET] ❌ ${error.response?.status || 'Network'} ${error.config?.url}`);
        }
        return Promise.reject(error);
      }
    );
  }

  async #executeWithRetry(requestFn, operation) {
    let lastError;

    for (let attempt = 0; attempt <= this.#MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (!this.#isRetryableError(error) || attempt === this.#MAX_RETRIES) {
          throw this.#handleError(error, operation);
        }

        const delay = this.#INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await this.#sleep(delay);
      }
    }

    throw this.#handleError(lastError, operation);
  }

  #isRetryableError(error) {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  #handleError(error, operation) {
    if (!error.response) {
      return new WalletAPIError(
        `Network error during ${operation}: ${error.message}`,
        'NETWORK_ERROR',
        0,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;
    const errorMessage = data?.error?.message || data?.message || error.message;

    if (status === 400) {
      if (errorMessage.toLowerCase().includes('otp')) {
        return new InvalidOTPError(errorMessage, data);
      }
      if (errorMessage.toLowerCase().includes('balance')) {
        return new InsufficientBalanceError(errorMessage, data);
      }
      return new ValidationError(errorMessage, data);
    }

    if (status === 404) {
      return new ContractNotFoundError(errorMessage, data);
    }

    if (status >= 500) {
      return new TransactionFailedError(errorMessage, data);
    }

    return new WalletAPIError(errorMessage, 'CIH_API_ERROR', status, data);
  }

  #sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Implement all methods to match MockWalletProvider interface
  // For now, delegate to mock with network error handling
  async preCreateWallet(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet?state=precreate', data);
      return response.data;
    }, 'preCreateWallet');
  }

  async activateWallet(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet?state=activate', data);
      return response.data;
    }, 'activateWallet');
  }

  async getCustomerInfo(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/clientinfo', data);
      return response.data;
    }, 'getCustomerInfo');
  }

  async getBalance(contractId) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.get(`/wallet/balance?contractid=${contractId}`);
      return response.data;
    }, 'getBalance');
  }

  async getTransactionHistory(contractId, limit = 10) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.get(`/wallet/operations?contractid=${contractId}&limit=${limit}`);
      return response.data;
    }, 'getTransactionHistory');
  }

  async cashInSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/in?step=simulation', data);
      return response.data;
    }, 'cashInSimulation');
  }

  async cashInConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/in?step=confirmation', data);
      return response.data;
    }, 'cashInConfirmation');
  }

  async cashOutSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/out?step=simulation', data);
      return response.data;
    }, 'cashOutSimulation');
  }

  async cashOutOTP(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/out/otp', data);
      return response.data;
    }, 'cashOutOTP');
  }

  async cashOutConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/out?step=confirmation', data);
      return response.data;
    }, 'cashOutConfirmation');
  }

  async walletTransferSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/wallet?step=simulation', data);
      return response.data;
    }, 'walletTransferSimulation');
  }

  async walletTransferOTP(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/wallet/otp', data);
      return response.data;
    }, 'walletTransferOTP');
  }

  async walletTransferConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/wallet?step=confirmation', data);
      return response.data;
    }, 'walletTransferConfirmation');
  }

  async bankTransferSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/virement?step=simulation', data);
      return response.data;
    }, 'bankTransferSimulation');
  }

  async bankTransferOTP(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/virement/otp', data);
      return response.data;
    }, 'bankTransferOTP');
  }

  async bankTransferConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/transfer/virement?step=confirmation', data);
      return response.data;
    }, 'bankTransferConfirmation');
  }

  async atmWithdrawalSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/gab/out?step=simulation', data);
      return response.data;
    }, 'atmWithdrawalSimulation');
  }

  async atmWithdrawalOTP(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/gab/otp', data);
      return response.data;
    }, 'atmWithdrawalOTP');
  }

  async atmWithdrawalConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/cash/gab/out?step=confirmation', data);
      return response.data;
    }, 'atmWithdrawalConfirmation');
  }

  async walletToMerchantSimulation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/Transfer/WalletToMerchant?step=simulation', data);
      return response.data;
    }, 'walletToMerchantSimulation');
  }

  async walletToMerchantOTP(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/walletToMerchant/cash/out/otp', data);
      return response.data;
    }, 'walletToMerchantOTP');
  }

  async walletToMerchantConfirmation(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/Transfer/WalletToMerchant?step=confirmation', data);
      return response.data;
    }, 'walletToMerchantConfirmation');
  }

  async merchantPreCreate(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/merchants', data);
      return response.data;
    }, 'merchantPreCreate');
  }

  async merchantActivate(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/merchant/activate', data);
      return response.data;
    }, 'merchantActivate');
  }

  async generateDynamicQRCode(data) {
    return this.#executeWithRetry(async () => {
      const response = await this.#api.post('/wallet/pro/qrcode/dynamic', data);
      return response.data;
    }, 'generateDynamicQRCode');
  }
}

