/**
 * Mock Banking Provider
 * 
 * High-fidelity simulation of CIH Bank APIs with:
 * - In-memory state management
 * - Network delay simulation
 * - Random error injection (5% chance)
 * - Transaction history tracking
 * - Rate limiting simulation
 */

import crypto from 'crypto';
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
  WalletState,
  TransactionRecord,
  BankingError,
  InsufficientBalanceError,
  ServiceUnavailableError,
  ValidationError,
} from './types.js';

/**
 * Mock Banking Provider Implementation
 */
export class MockBankingProvider implements IBankingProvider {
  private wallets: Map<string, WalletState>;
  private transactions: Map<string, TransactionRecord>;
  private readonly DEFAULT_BALANCE = 1000; // 1,000 MAD
  private readonly TRANSACTION_FEE_PERCENTAGE = 0.02; // 2%
  private readonly MIN_FEE = 5; // 5 MAD
  private readonly MAX_FEE = 100; // 100 MAD
  private readonly ERROR_INJECTION_RATE = 0.05; // 5% chance
  private readonly NETWORK_DELAY_MIN = 100; // 100ms
  private readonly NETWORK_DELAY_MAX = 500; // 500ms
  private readonly ENABLE_LOGGING = process.env.NODE_ENV === 'development' || true;

  constructor() {
    this.wallets = new Map();
    this.transactions = new Map();
    this.log('🏦 [MOCK BANK] Initialized with in-memory state');
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.ENABLE_LOGGING) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Simulate network delay
   */
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.floor(
      Math.random() * (this.NETWORK_DELAY_MAX - this.NETWORK_DELAY_MIN + 1) + this.NETWORK_DELAY_MIN
    );
    await this.sleep(delay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Inject random errors (5% chance)
   */
  private shouldInjectError(): boolean {
    return Math.random() < this.ERROR_INJECTION_RATE;
  }

  /**
   * Get or create wallet
   */
  private getOrCreateWallet(contractId: string): WalletState {
    if (!this.wallets.has(contractId)) {
      const wallet: WalletState = {
        contractId,
        balance: this.DEFAULT_BALANCE,
        currency: 'MAD',
        createdAt: new Date(),
        lastUpdated: new Date(),
        transactionCount: 0,
      };
      this.wallets.set(contractId, wallet);
      this.log(`💰 [MOCK BANK] Created wallet ${contractId} with balance ${this.DEFAULT_BALANCE} MAD`);
    }
    return this.wallets.get(contractId)!;
  }

  /**
   * Calculate transaction fee
   */
  private calculateFee(amount: number): number {
    const fee = Math.max(this.MIN_FEE, Math.min(this.MAX_FEE, amount * this.TRANSACTION_FEE_PERCENTAGE));
    return Math.round(fee * 100) / 100; // Round to 2 decimals
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `MOCK-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Generate reference
   */
  private generateReference(): string {
    return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
   */
  async getBalance(contractId: string): Promise<BalanceData> {
    this.validateContractId(contractId);

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const wallet = this.getOrCreateWallet(contractId);
    this.log(`💵 [MOCK BANK] Get balance for ${contractId}: ${wallet.balance} ${wallet.currency}`);

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      contractId: wallet.contractId,
    };
  }

  /**
   * Simulate transfer to calculate fees
   */
  async simulateTransfer(request: TransferSimulationRequest): Promise<TransferSimulationResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    if (!request.destinationPhone && !request.RIB) {
      throw new ValidationError('Either destinationPhone or RIB is required');
    }

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const wallet = this.getOrCreateWallet(request.ContractId);
    const fee = this.calculateFee(request.Amount);
    const totalAmountWithFee = request.Amount + fee;

    // Check balance
    if (wallet.balance < totalAmountWithFee) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${wallet.balance} MAD, Required: ${totalAmountWithFee} MAD`,
        {
          available: wallet.balance,
          required: totalAmountWithFee,
          amount: request.Amount,
          fee: fee,
        }
      );
    }

    this.log(`🔍 [MOCK BANK] Simulate transfer: ${request.ContractId} -> ${request.destinationPhone || request.RIB}`);
    this.log(`   Amount: ${request.Amount} MAD, Fee: ${fee} MAD, Total: ${totalAmountWithFee} MAD`);

    return {
      totalAmountWithFee,
      frais: fee,
      breakdown: {
        amount: request.Amount,
        fee: fee,
        total: totalAmountWithFee,
      },
    };
  }

  /**
   * Execute transfer
   */
  async executeTransfer(request: TransferExecutionRequest): Promise<TransferExecutionResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    if (!request.destinationPhone && !request.RIB) {
      throw new ValidationError('Either destinationPhone or RIB is required');
    }

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const sourceWallet = this.getOrCreateWallet(request.ContractId);
    const destinationId = request.destinationPhone || request.RIB!;
    const destinationWallet = this.getOrCreateWallet(destinationId);

    // Calculate fee
    const fee = this.calculateFee(request.Amount);
    const totalAmountWithFee = request.Amount + fee;

    // Check balance
    if (sourceWallet.balance < totalAmountWithFee) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${sourceWallet.balance} MAD, Required: ${totalAmountWithFee} MAD`,
        {
          available: sourceWallet.balance,
          required: totalAmountWithFee,
          amount: request.Amount,
          fee: fee,
        }
      );
    }

    // Execute transfer
    sourceWallet.balance = Math.round((sourceWallet.balance - totalAmountWithFee) * 100) / 100;
    destinationWallet.balance = Math.round((destinationWallet.balance + request.Amount) * 100) / 100;
    sourceWallet.lastUpdated = new Date();
    destinationWallet.lastUpdated = new Date();
    sourceWallet.transactionCount++;
    destinationWallet.transactionCount++;

    // Create transaction record
    const transactionId = this.generateTransactionId();
    const reference = this.generateReference();

    const transaction: TransactionRecord = {
      transactionId,
      reference,
      type: 'transfer',
      sourceContractId: request.ContractId,
      destinationContractId: destinationId,
      amount: request.Amount,
      fee: fee,
      totalAmount: totalAmountWithFee,
      status: 'completed',
      timestamp: new Date(),
      metadata: {
        destinationPhone: request.destinationPhone,
        RIB: request.RIB,
      },
    };

    this.transactions.set(transactionId, transaction);

    this.log(`✅ [MOCK BANK] Transfer executed: ${transactionId}`);
    this.log(`   From: ${request.ContractId} (Balance: ${sourceWallet.balance} MAD)`);
    this.log(`   To: ${destinationId} (Balance: ${destinationWallet.balance} MAD)`);
    this.log(`   Amount: ${request.Amount} MAD, Fee: ${fee} MAD, Total: ${totalAmountWithFee} MAD`);

    return {
      transactionId,
      reference,
      status: 'completed',
      timestamp: new Date(),
    };
  }

  /**
   * Cash-in (deposit to wallet)
   */
  async cashIn(request: CashInRequest): Promise<CashInResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const wallet = this.getOrCreateWallet(request.ContractId);
    wallet.balance = Math.round((wallet.balance + request.Amount) * 100) / 100;
    wallet.lastUpdated = new Date();
    wallet.transactionCount++;

    const transactionId = this.generateTransactionId();
    const reference = this.generateReference();

    const transaction: TransactionRecord = {
      transactionId,
      reference,
      type: 'cash-in',
      sourceContractId: request.ContractId,
      amount: request.Amount,
      fee: 0,
      totalAmount: request.Amount,
      status: 'completed',
      timestamp: new Date(),
      metadata: {
        method: request.method,
        reference: request.reference,
      },
    };

    this.transactions.set(transactionId, transaction);

    this.log(`💰 [MOCK BANK] Cash-in executed: ${transactionId}`);
    this.log(`   Contract: ${request.ContractId}, Amount: ${request.Amount} MAD`);
    this.log(`   Method: ${request.method}, New Balance: ${wallet.balance} MAD`);

    return {
      transactionId,
      reference,
      status: 'completed',
      availableMethods: ['branch', 'atm', 'pos', 'online'],
    };
  }

  /**
   * Cash-out (withdraw from wallet)
   */
  async cashOut(request: CashOutRequest): Promise<CashOutResponse> {
    this.validateContractId(request.ContractId);
    this.validateAmount(request.Amount);

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const wallet = this.getOrCreateWallet(request.ContractId);

    // Check balance
    if (wallet.balance < request.Amount) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${wallet.balance} MAD, Required: ${request.Amount} MAD`,
        {
          available: wallet.balance,
          required: request.Amount,
        }
      );
    }

    wallet.balance = Math.round((wallet.balance - request.Amount) * 100) / 100;
    wallet.lastUpdated = new Date();
    wallet.transactionCount++;

    const transactionId = this.generateTransactionId();
    const reference = this.generateReference();

    const transaction: TransactionRecord = {
      transactionId,
      reference,
      type: 'cash-out',
      sourceContractId: request.ContractId,
      amount: request.Amount,
      fee: 0,
      totalAmount: request.Amount,
      status: 'completed',
      timestamp: new Date(),
      metadata: {
        method: request.method,
        destination: request.destination,
      },
    };

    this.transactions.set(transactionId, transaction);

    this.log(`💸 [MOCK BANK] Cash-out executed: ${transactionId}`);
    this.log(`   Contract: ${request.ContractId}, Amount: ${request.Amount} MAD`);
    this.log(`   Method: ${request.method}, New Balance: ${wallet.balance} MAD`);

    return {
      transactionId,
      reference,
      status: 'completed',
      availableMethods: ['branch', 'atm', 'pos'],
    };
  }

  /**
   * Release escrow payment
   */
  async releaseEscrow(request: EscrowReleaseRequest): Promise<EscrowReleaseResponse> {
    this.validateContractId(request.buyerId);
    this.validateContractId(request.sellerId);
    this.validateAmount(request.amount);

    // Simulate network delay
    await this.simulateNetworkDelay();

    // Inject random error (5% chance)
    if (this.shouldInjectError()) {
      this.log('❌ [MOCK BANK] Injected service unavailable error');
      throw new ServiceUnavailableError('Banking service temporarily unavailable. Please try again.');
    }

    const buyerWallet = this.getOrCreateWallet(request.buyerId);
    const fee = this.calculateFee(request.amount);
    const totalAmountWithFee = request.amount + fee;

    // Check buyer balance
    if (buyerWallet.balance < totalAmountWithFee) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${buyerWallet.balance} MAD, Required: ${totalAmountWithFee} MAD`,
        {
          available: buyerWallet.balance,
          required: totalAmountWithFee,
          amount: request.amount,
          fee: fee,
        }
      );
    }

    // Execute transfer
    const sellerWallet = this.getOrCreateWallet(request.sellerId);
    buyerWallet.balance = Math.round((buyerWallet.balance - totalAmountWithFee) * 100) / 100;
    sellerWallet.balance = Math.round((sellerWallet.balance + request.amount) * 100) / 100;
    buyerWallet.lastUpdated = new Date();
    sellerWallet.lastUpdated = new Date();
    buyerWallet.transactionCount++;
    sellerWallet.transactionCount++;

    const transactionId = this.generateTransactionId();
    const reference = this.generateReference();

    const transaction: TransactionRecord = {
      transactionId,
      reference,
      type: 'escrow',
      sourceContractId: request.buyerId,
      destinationContractId: request.sellerId,
      amount: request.amount,
      fee: fee,
      totalAmount: totalAmountWithFee,
      status: 'completed',
      timestamp: new Date(),
      metadata: {
        originalTransactionId: request.transactionId,
        escrowRelease: true,
      },
    };

    this.transactions.set(transactionId, transaction);

    this.log(`🔓 [MOCK BANK] Escrow released: ${transactionId}`);
    this.log(`   Buyer: ${request.buyerId} (Balance: ${buyerWallet.balance} MAD)`);
    this.log(`   Seller: ${request.sellerId} (Balance: ${sellerWallet.balance} MAD)`);
    this.log(`   Amount: ${request.amount} MAD, Fee: ${fee} MAD`);

    return {
      transactionId,
      reference,
      buyerBalance: buyerWallet.balance,
      sellerBalance: sellerWallet.balance,
      status: 'completed',
    };
  }

  /**
   * Get all wallets (for debugging/admin)
   */
  getAllWallets(): WalletState[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Get all transactions (for debugging/admin)
   */
  getAllTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Get wallet by contract ID (for debugging/admin)
   */
  getWallet(contractId: string): WalletState | undefined {
    return this.wallets.get(contractId);
  }

  /**
   * Get transaction by ID (for debugging/admin)
   */
  getTransaction(transactionId: string): TransactionRecord | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Set wallet balance (for testing)
   */
  setWalletBalance(contractId: string, balance: number): void {
    const wallet = this.getOrCreateWallet(contractId);
    wallet.balance = balance;
    wallet.lastUpdated = new Date();
    this.log(`🔧 [MOCK BANK] Set balance for ${contractId}: ${balance} MAD`);
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.wallets.clear();
    this.transactions.clear();
    this.log('🔄 [MOCK BANK] All data reset');
  }
}

