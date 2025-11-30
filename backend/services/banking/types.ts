/**
 * Banking Service Types
 * 
 * Comprehensive TypeScript types for the banking service layer
 * supporting both CIH Bank live APIs and mock implementations.
 */

/**
 * Balance response structure from CIH API
 */
export interface BalanceResponse {
  result: {
    balance: Array<{
      value: string;
    }>;
  };
}

/**
 * Normalized balance data
 */
export interface BalanceData {
  balance: number;
  currency: string;
  contractId: string;
}

/**
 * Transfer simulation request payload
 */
export interface TransferSimulationRequest {
  ContractId: string;
  Amount: number;
  destinationPhone?: string;
  RIB?: string;
}

/**
 * Transfer simulation response
 */
export interface TransferSimulationResponse {
  totalAmountWithFee: number;
  frais: number;
  breakdown?: {
    amount: number;
    fee: number;
    total: number;
  };
}

/**
 * Transfer execution request payload
 */
export interface TransferExecutionRequest {
  ContractId: string;
  Amount: number;
  destinationPhone?: string;
  RIB?: string;
}

/**
 * Transfer execution response
 */
export interface TransferExecutionResponse {
  transactionId: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp?: Date;
}

/**
 * Cash-in request
 */
export interface CashInRequest {
  ContractId: string;
  Amount: number;
  method: 'branch' | 'atm' | 'pos' | 'online';
  reference?: string;
}

/**
 * Cash-in response
 */
export interface CashInResponse {
  transactionId: string;
  reference: string;
  status: 'completed' | 'pending';
  availableMethods?: string[];
}

/**
 * Cash-out request
 */
export interface CashOutRequest {
  ContractId: string;
  Amount: number;
  method: 'branch' | 'atm' | 'pos';
  destination?: string;
}

/**
 * Cash-out response
 */
export interface CashOutResponse {
  transactionId: string;
  reference: string;
  status: 'completed' | 'pending';
  availableMethods?: string[];
}

/**
 * Escrow release request
 */
export interface EscrowReleaseRequest {
  buyerId: string;
  sellerId: string;
  amount: number;
  transactionId?: string;
}

/**
 * Escrow release response
 */
export interface EscrowReleaseResponse {
  transactionId: string;
  reference: string;
  buyerBalance: number;
  sellerBalance: number;
  status: 'completed';
}

/**
 * Banking provider interface
 * All providers must implement this interface
 */
export interface IBankingProvider {
  /**
   * Get wallet balance
   */
  getBalance(contractId: string): Promise<BalanceData>;

  /**
   * Simulate transfer to calculate fees
   */
  simulateTransfer(request: TransferSimulationRequest): Promise<TransferSimulationResponse>;

  /**
   * Execute transfer
   */
  executeTransfer(request: TransferExecutionRequest): Promise<TransferExecutionResponse>;

  /**
   * Cash-in (deposit to wallet)
   */
  cashIn(request: CashInRequest): Promise<CashInResponse>;

  /**
   * Cash-out (withdraw from wallet)
   */
  cashOut(request: CashOutRequest): Promise<CashOutResponse>;

  /**
   * Release escrow payment
   */
  releaseEscrow(request: EscrowReleaseRequest): Promise<EscrowReleaseResponse>;
}

/**
 * Banking error types
 */
export class BankingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'BankingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientBalanceError extends BankingError {
  constructor(message = 'Insufficient balance', details?: any) {
    super(message, 'INSUFFICIENT_BALANCE', 400, details);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidCredentialsError extends BankingError {
  constructor(message = 'Invalid banking credentials', details?: any) {
    super(message, 'INVALID_CREDENTIALS', 401, details);
    this.name = 'InvalidCredentialsError';
  }
}

export class NetworkError extends BankingError {
  constructor(message = 'Network error', details?: any) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class ServiceUnavailableError extends BankingError {
  constructor(message = 'Banking service unavailable', details?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

export class ValidationError extends BankingError {
  constructor(message = 'Invalid request parameters', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  enableLogging?: boolean;
}

/**
 * Transaction record (for mock provider)
 */
export interface TransactionRecord {
  transactionId: string;
  reference: string;
  type: 'transfer' | 'cash-in' | 'cash-out' | 'escrow';
  sourceContractId: string;
  destinationContractId?: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Wallet state (for mock provider)
 */
export interface WalletState {
  contractId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  lastUpdated: Date;
  transactionCount: number;
}

