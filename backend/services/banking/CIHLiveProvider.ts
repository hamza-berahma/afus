/**
 * CIH Live Banking Provider
 * 
 * Production implementation using real CIH Bank APIs.
 * Handles all HTTP requests, retries, and error scenarios.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  IBankingProvider,
  BalanceData,
  TransferSimulationRequest,
  TransferSimulationResponse,
  TransferExecutionRequest,
  TransferExecutionResponse,
  CashInRequest,
  CashInResponse,
  CashOutRequest,
  CashOutResponse,
  EscrowReleaseRequest,
  EscrowReleaseResponse,
  BalanceResponse,
  ProviderConfig,
  BankingError,
  InsufficientBalanceError,
  InvalidCredentialsError,
  NetworkError,
  ServiceUnavailableError,
  ValidationError,
} from './types.js';

/**
 * CIH Live Provider Implementation
 */
export class CIHLiveProvider implements IBankingProvider {
  private api: AxiosInstance;
  private config: Required<ProviderConfig>;
  private readonly MAX_RETRIES: number;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(config: ProviderConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.CIH_API_BASE_URL || '',
      apiKey: config.apiKey || process.env.CIH_API_KEY || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      enableLogging: config.enableLogging ?? process.env.NODE_ENV === 'development',
    };

    this.MAX_RETRIES = this.config.retries;

    if (!this.config.baseUrl) {
      throw new Error('CIH_API_BASE_URL is required for live provider');
    }

    if (!this.config.apiKey) {
      throw new Error('CIH_API_KEY is required for live provider');
    }

    // Create axios instance
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.config.enableLogging) {
          console.log(`[🏦 CIH LIVE] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }
        return config;
      },
      (error) => {
        console.error('[🏦 CIH LIVE] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        if (this.config.enableLogging) {
          console.log(`[🏦 CIH LIVE] ✅ ${response.status} ${response.config.url}`, {
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        if (this.config.enableLogging) {
          const errorMsg = error.response
            ? `[🏦 CIH LIVE] ❌ ${error.response.status} ${error.config?.url}`
            : `[🏦 CIH LIVE] ❌ Network error`;
          console.error(errorMsg, {
            status: error.response?.status,
            data: error.response?.data,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    operation: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === this.MAX_RETRIES) {
          throw this.handleError(error, operation);
        }

        // Calculate exponential backoff delay
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        if (this.config.enableLogging) {
          console.warn(
            `[🏦 CIH LIVE] ⚠️  ${operation} failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}), retrying in ${delay}ms`
          );
        }
        await this.sleep(delay);
      }
    }

    throw this.handleError(lastError, operation);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      return true; // Network errors are retryable
    }

    const status = error.response.status;
    // Retry on 5xx errors and 429 (Too Many Requests)
    return status >= 500 || status === 429;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, operation: string): BankingError {
    if (!error.response) {
      return new NetworkError(
        `Network error during ${operation}: ${error.message}`,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;
    const errorMessage = data?.message || data?.error || error.message || `CIH API error during ${operation}`;

    // Handle specific error cases
    if (status === 401 || status === 403) {
      return new InvalidCredentialsError(errorMessage, data);
    }

    if (status === 400) {
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('balance') || lowerMessage.includes('insufficient')) {
        return new InsufficientBalanceError(errorMessage, data);
      }
      return new ValidationError(errorMessage, data);
    }

    if (status >= 500) {
      return new ServiceUnavailableError(errorMessage, data);
    }

    return new BankingError(errorMessage, 'CIH_API_ERROR', status, data);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate contract ID
   */
  private validateContractId(contractId: string): void {
    if (!contractId || typeof contractId !== 'string' || contractId.trim().length === 0) {
      throw new ValidationError('ContractId is required and must be a non-empty string');
    }
  }

  /**
   * Validate amount
   */
  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      throw new ValidationError('Amount must be a positive number');
    }
  }

  /**
   * Get wallet balance
   * GET /wallet/balance?ContractId={contractId}
   */
  async getBalance(contractId: string): Promise<BalanceData> {
    this.validateContractId(contractId);

    return this.executeWithRetry(async () => {
      const response = await this.api.get<BalanceResponse>('/wallet/balance', {
        params: { ContractId: contractId },
      });

      // Handle CIH API response structure: { "result": { "balance": [{ "value": "12556.88" }] } }
      const balanceArray = response.data?.result?.balance;
      if (!balanceArray || balanceArray.length === 0) {
        throw new BankingError('Invalid balance response structure', 'INVALID_RESPONSE', 500);
      }

      const balanceValue = parseFloat(balanceArray[0]?.value || '0');
      if (isNaN(balanceValue)) {
        throw new BankingError('Invalid balance value in response', 'INVALID_RESPONSE', 500);
      }

      return {
        balance: balanceValue,
        currency: 'MAD',
        contractId: contractId,
      };
    }, 'getBalance');
  }

  /**
   * Simulate transfer to calculate fees
   * POST /wallet/transfer/virement?step=simulation
   */
  async simulateTransfer(request: TransferSimulationRequest): Promise<TransferSimulationResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    if (!request.destinationPhone && !request.RIB) {
      throw new ValidationError('Either destinationPhone or RIB is required');
    }

    return this.executeWithRetry(async () => {
      const payload: any = {
        ContractId: request.ContractId,
        Amount: request.Amount,
      };

      if (request.destinationPhone) {
        payload.destinationPhone = request.destinationPhone;
      }
      if (request.RIB) {
        payload.RIB = request.RIB;
      }

      const response = await this.api.post('/wallet/transfer/virement', payload, {
        params: { step: 'simulation' },
      });

      const data = response.data;
      const totalAmountWithFee = parseFloat(data?.totalAmountWithFee || data?.TotalAmountWithFee || '0');
      const frais = parseFloat(data?.frais || data?.Frais || '0');

      if (isNaN(totalAmountWithFee) || isNaN(frais)) {
        throw new BankingError('Invalid simulation response structure', 'INVALID_RESPONSE', 500);
      }

      return {
        totalAmountWithFee,
        frais,
        breakdown: {
          amount: request.Amount,
          fee: frais,
          total: totalAmountWithFee,
        },
      };
    }, 'simulateTransfer');
  }

  /**
   * Execute transfer
   * POST /wallet/transfer/virement
   */
  async executeTransfer(request: TransferExecutionRequest): Promise<TransferExecutionResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    if (!request.destinationPhone && !request.RIB) {
      throw new ValidationError('Either destinationPhone or RIB is required');
    }

    return this.executeWithRetry(async () => {
      const payload: any = {
        ContractId: request.ContractId,
        Amount: request.Amount,
      };

      if (request.destinationPhone) {
        payload.destinationPhone = request.destinationPhone;
      }
      if (request.RIB) {
        payload.RIB = request.RIB;
      }

      const response = await this.api.post('/wallet/transfer/virement', payload);

      const data = response.data;
      const transactionId = data?.transactionId || data?.TransactionId || data?.id || '';
      const reference = data?.reference || data?.Reference || data?.transactionId || '';

      if (!transactionId) {
        throw new BankingError('Transaction ID not found in response', 'INVALID_RESPONSE', 500);
      }

      return {
        transactionId,
        reference,
        status: 'completed',
        timestamp: new Date(),
      };
    }, 'executeTransfer');
  }

  /**
   * Cash-in (deposit to wallet)
   * POST /wallet/cash-in
   */
  async cashIn(request: CashInRequest): Promise<CashInResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    return this.executeWithRetry(async () => {
      const payload = {
        ContractId: request.ContractId,
        Amount: request.Amount,
        method: request.method,
        ...(request.reference && { reference: request.reference }),
      };

      const response = await this.api.post('/wallet/cash-in', payload);

      const data = response.data;
      return {
        transactionId: data?.transactionId || data?.TransactionId || '',
        reference: data?.reference || data?.Reference || '',
        status: data?.status === 'pending' ? 'pending' : 'completed',
        availableMethods: data?.availableMethods || ['branch', 'atm', 'pos', 'online'],
      };
    }, 'cashIn');
  }

  /**
   * Cash-out (withdraw from wallet)
   * POST /wallet/cash-out
   */
  async cashOut(request: CashOutRequest): Promise<CashOutResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    return this.executeWithRetry(async () => {
      const payload = {
        ContractId: request.ContractId,
        Amount: request.Amount,
        method: request.method,
        ...(request.destination && { destination: request.destination }),
      };

      const response = await this.api.post('/wallet/cash-out', payload);

      const data = response.data;
      return {
        transactionId: data?.transactionId || data?.TransactionId || '',
        reference: data?.reference || data?.Reference || '',
        status: data?.status === 'pending' ? 'pending' : 'completed',
        availableMethods: data?.availableMethods || ['branch', 'atm', 'pos'],
      };
    }, 'cashOut');
  }

  /**
   * Release escrow payment
   * This wraps the transfer logic for escrow scenarios
   */
  async releaseEscrow(request: EscrowReleaseRequest): Promise<EscrowReleaseResponse> {
    this.validateContractId(request.buyerId);
    this.validateContractId(request.sellerId);
    this.validateAmount(request.amount);

    // First, get buyer balance to verify sufficient funds
    const buyerBalance = await this.getBalance(request.buyerId);

    if (buyerBalance.balance < request.amount) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${buyerBalance.balance} MAD, Required: ${request.amount} MAD`,
        { buyerBalance: buyerBalance.balance, requiredAmount: request.amount }
      );
    }

    // Execute transfer from buyer to seller
    const transferResult = await this.executeTransfer({
      ContractId: request.buyerId,
      Amount: request.amount,
      destinationPhone: request.sellerId, // Assuming sellerId can be used as destination
    });

    // Get updated balances
    const updatedBuyerBalance = await this.getBalance(request.buyerId);
    const updatedSellerBalance = await this.getBalance(request.sellerId);

    return {
      transactionId: transferResult.transactionId,
      reference: transferResult.reference,
      buyerBalance: updatedBuyerBalance.balance,
      sellerBalance: updatedSellerBalance.balance,
      status: 'completed',
    };
  }
}

