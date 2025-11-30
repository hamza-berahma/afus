/**
 * Mock Wallet API Provider
 * 
 * High-fidelity simulation of CIH Wallet API with:
 * - In-memory state management
 * - Complete transaction history
 * - Realistic delays and responses
 * - All endpoints implemented
 */

import {
  ValidationError,
  InvalidOTPError,
  InsufficientBalanceError,
  ContractNotFoundError,
} from './types.js';
import {
  generateToken,
  generateRIB,
  generateContractId,
  generateTransactionId,
  generateTransactionReference,
  generateOTP,
  generateHexToken,
  generateMerchantToken,
} from './utils/generators.js';
import {
  validatePhoneNumber,
  validateAmount,
  validateRequiredFields,
  validateRIB,
} from './utils/validation.js';
import { formatSuccessResponse } from './utils/formatters.js';

export class MockWalletProvider {
  #wallets = new Map();
  #merchants = new Map();
  #transactions = new Map();
  #otpStore = new Map(); // Store OTPs temporarily
  #tokens = new Map(); // Store activation tokens
  #DEFAULT_BALANCE = 1000.00;
  #ENABLE_LOGGING = process.env.NODE_ENV === 'development' || true;

  constructor() {
    this.log('🏦 [MOCK WALLET API] Initialized');
  }

  log(message, data) {
    if (this.#ENABLE_LOGGING) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * 1. Wallet Pre-Creation
   */
  async preCreateWallet(data) {
    validateRequiredFields(data, ['phoneNumber', 'clientFirstName', 'clientLastName']);
    validatePhoneNumber(data.phoneNumber);

    const token = generateToken();
    const otp = generateOTP();

    // Store token and OTP for activation
    this.#tokens.set(token, {
      ...data,
      createdAt: new Date(),
    });
    this.#otpStore.set(token, otp);

    this.log('📝 [MOCK WALLET] Pre-creation', { phoneNumber: data.phoneNumber, token });

    return formatSuccessResponse({
      firstName: data.clientFirstName,
      lastName: data.clientLastName,
      mobileNumber: data.phoneNumber,
      otp: otp,
      token: token,
      phoneOperator: data.phoneOperator || 'IAM',
      email: data.email || '',
      placeOfBirth: data.placeOfBirth || '',
      dateOfBirth: data.dateOfBirth || '',
      clientAddress: data.clientAddress || '',
      gender: data.gender || 'M',
      legalType: data.legalType || 'CIN',
      legalId: data.legalId || '',
    });
  }

  /**
   * 2. Wallet Activation
   */
  async activateWallet(data) {
    validateRequiredFields(data, ['otp', 'token']);

    const tokenData = this.#tokens.get(data.token);
    if (!tokenData) {
      throw new ValidationError('Invalid or expired token');
    }

    const storedOTP = this.#otpStore.get(data.token);
    if (data.otp !== storedOTP) {
      throw new InvalidOTPError('OTP is invalid or expired');
    }

    const contractId = generateContractId();
    const rib = generateRIB();

    // Create wallet
    const wallet = {
      contractId,
      rib,
      phoneNumber: tokenData.phoneNumber,
      firstName: tokenData.clientFirstName,
      lastName: tokenData.clientLastName,
      email: tokenData.email,
      balance: this.#DEFAULT_BALANCE,
      level: '000',
      status: 'active',
      createdAt: new Date(),
      products: [{
        contractId,
        name: 'CDP BASIC',
        productTypeName: 'PARTICULIER',
        rib,
        solde: this.#DEFAULT_BALANCE.toFixed(2),
        statusId: '1',
        level: '000',
      }],
    };

    this.#wallets.set(contractId, wallet);
    this.#wallets.set(tokenData.phoneNumber, wallet); // Index by phone

    // Clean up
    this.#tokens.delete(data.token);
    this.#otpStore.delete(data.token);

    this.log('✅ [MOCK WALLET] Activated', { contractId, phoneNumber: tokenData.phoneNumber });

    return formatSuccessResponse({
      contractId,
      reference: '',
      level: '000',
      rib,
    });
  }

  /**
   * 3. Customer Information Consultation
   */
  async getCustomerInfo(data) {
    validateRequiredFields(data, ['phoneNumber']);

    const wallet = this.#wallets.get(data.phoneNumber);
    if (!wallet) {
      throw new ContractNotFoundError('Customer not found');
    }

    return formatSuccessResponse({
      phoneNumber: wallet.phoneNumber,
      tierFirstName: wallet.firstName,
      tierLastName: wallet.lastName,
      email: wallet.email,
      products: wallet.products,
      soldeCumule: wallet.balance.toFixed(2),
    });
  }

  /**
   * 4. Balance Consultation
   */
  async getBalance(contractId) {
    if (!contractId) {
      throw new ValidationError('Contract ID is required');
    }

    const wallet = this.#wallets.get(contractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    return formatSuccessResponse({
      balance: [
        { value: wallet.balance.toFixed(2) }
      ]
    });
  }

  /**
   * 5. Transaction History
   */
  async getTransactionHistory(contractId, limit = 10) {
    if (!contractId) {
      throw new ValidationError('Contract ID is required');
    }

    const wallet = this.#wallets.get(contractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    // Get transactions for this wallet
    const transactions = Array.from(this.#transactions.values())
      .filter(tx => 
        tx.contractId === contractId || 
        tx.sourceContractId === contractId ||
        tx.destinationContractId === contractId
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map(tx => ({
        amount: tx.amount.toFixed(2),
        Fees: tx.fees.toFixed(2),
        beneficiaryFirstName: tx.beneficiaryFirstName || '',
        beneficiaryLastName: tx.beneficiaryLastName || '',
        clientNote: tx.clientNote || '',
        currency: tx.currency || 'MAD',
        date: tx.date,
        referenceId: tx.referenceId,
        status: tx.status || '000',
        type: tx.type,
        totalFrai: tx.totalFees.toFixed(2),
        isCanceled: tx.isCanceled || false,
        totalPage: limit,
      }));

    return formatSuccessResponse(transactions);
  }

  /**
   * 6. Cash IN - Simulation
   */
  async cashInSimulation(data) {
    validateRequiredFields(data, ['contractId', 'amount']);
    validateAmount(data.amount);

    const wallet = this.#wallets.get(data.contractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    const amount = parseFloat(data.amount);
    const fees = parseFloat(data.fees || '0');
    const token = generateHexToken();
    const transactionId = generateTransactionId();

    return formatSuccessResponse({
      Fees: fees.toFixed(2),
      feeDetail: 'Nature:"COM",InvariantFee:0.000,VariantFee:0.0000000',
      token,
      amountToCollect: amount,
      isTier: true,
      cardId: data.contractId,
      transactionId,
      benFirstName: wallet.firstName,
      benLastName: wallet.lastName,
    });
  }

  /**
   * 7. Cash IN - Confirmation
   */
  async cashInConfirmation(data) {
    validateRequiredFields(data, ['token', 'amount']);

    const amount = parseFloat(data.amount);
    const fees = parseFloat(data.fees || '0');
    const transactionReference = generateTransactionReference();

    // Update wallet balance
    const wallet = this.findWalletByContractId(data.contractId);
    if (wallet) {
      wallet.balance += amount;
      wallet.lastUpdated = new Date();

      // Record transaction
      this.#transactions.set(transactionReference, {
        contractId: data.contractId,
        amount,
        fees,
        totalFees: fees,
        type: 'CIN',
        date: new Date().toISOString(),
        referenceId: transactionReference,
        status: '000',
        isCanceled: false,
      });
    }

    return formatSuccessResponse({
      Fees: fees.toFixed(2),
      token: data.token,
      amount,
      transactionReference,
      cardId: data.contractId,
    });
  }

  /**
   * 8. Cash OUT - Simulation
   */
  async cashOutSimulation(data) {
    validateRequiredFields(data, ['phoneNumber', 'amount']);
    validatePhoneNumber(data.phoneNumber);
    validateAmount(data.amount);

    const wallet = this.#wallets.get(data.phoneNumber);
    if (!wallet) {
      throw new ContractNotFoundError('Wallet not found');
    }

    const amount = parseFloat(data.amount);
    const fees = parseFloat(data.fees || '0');
    const totalAmount = amount + fees;

    if (wallet.balance < totalAmount) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${wallet.balance.toFixed(2)}, Required: ${totalAmount.toFixed(2)}`
      );
    }

    const token = generateHexToken();
    const transactionId = generateTransactionId();

    return formatSuccessResponse({
      Fees: fees.toFixed(2),
      token,
      amountToCollect: amount,
      cashOut_Max: (wallet.balance - totalAmount).toFixed(2),
      cardId: wallet.contractId,
      transactionId,
      feeDetail: 'Nature:"COM",InvariantFee:0.000,VariantFee:0.0000000',
    });
  }

  /**
   * 9. Cash OUT - OTP Generation
   */
  async cashOutOTP(data) {
    validateRequiredFields(data, ['phoneNumber']);
    validatePhoneNumber(data.phoneNumber);

    const otp = generateOTP();
    this.#otpStore.set(data.phoneNumber, otp);

    return formatSuccessResponse([
      { codeOtp: otp }
    ]);
  }

  /**
   * 10. Cash OUT - Confirmation
   */
  async cashOutConfirmation(data) {
    validateRequiredFields(data, ['otp', 'token', 'amount']);

    const wallet = this.#wallets.get(data.phoneNumber);
    if (!wallet) {
      throw new ContractNotFoundError('Wallet not found');
    }

    const storedOTP = this.#otpStore.get(data.phoneNumber);
    if (data.otp !== storedOTP) {
      throw new InvalidOTPError('Invalid OTP');
    }

    const amount = parseFloat(data.amount);
    const fees = parseFloat(data.fees || '0');
    const totalAmount = amount + fees;

    if (wallet.balance < totalAmount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    wallet.balance -= totalAmount;
    wallet.lastUpdated = new Date();

    const transactionReference = generateTransactionReference();

    this.#transactions.set(transactionReference, {
      contractId: wallet.contractId,
      amount,
      fees,
      totalFees: fees,
      type: 'COUT',
      date: new Date().toISOString(),
      referenceId: transactionReference,
      status: '000',
      isCanceled: false,
    });

    this.#otpStore.delete(data.phoneNumber);

    return formatSuccessResponse({
      Fees: fees.toFixed(2),
      token: data.token,
      amount,
      transactionReference,
      cardId: wallet.contractId,
    });
  }

  /**
   * 11. Wallet to Wallet Transfer - Simulation
   */
  async walletTransferSimulation(data) {
    validateRequiredFields(data, ['contractId', 'amout', 'destinationPhone']);
    validatePhoneNumber(data.destinationPhone);
    validateAmount(data.amout);

    const sourceWallet = this.#wallets.get(data.contractId);
    if (!sourceWallet) {
      throw new ContractNotFoundError('Source wallet not found');
    }

    const destWallet = this.#wallets.get(data.destinationPhone);
    if (!destWallet) {
      throw new ContractNotFoundError('Destination wallet not found');
    }

    const amount = parseFloat(data.amout);
    const fees = parseFloat(data.fees || '0');
    const feeAmount = amount * 0.05; // 5% fee
    const taxAmount = feeAmount * 0.20; // 20% tax
    const totalFees = feeAmount + taxAmount;
    const totalAmount = amount + totalFees;

    if (sourceWallet.balance < totalAmount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    const referenceId = generateTransactionReference();

    return formatSuccessResponse({
      amount: data.amout,
      Fees: fees,
      beneficiaryFirstName: destWallet.firstName,
      beneficiaryLastName: destWallet.lastName,
      referenceId,
      frais: [
        {
          currency: 'MAD',
          name: 'COM',
          referenceId,
          value: feeAmount.toFixed(2),
        },
        {
          currency: 'MAD',
          name: 'TVA',
          referenceId,
          value: taxAmount.toFixed(2),
        },
      ],
      totalAmount: totalAmount.toFixed(2),
      totalFrai: totalFees.toFixed(2),
      type: 'TT',
      isCanceled: false,
    });
  }

  /**
   * 12. Wallet to Wallet Transfer - OTP
   */
  async walletTransferOTP(data) {
    validateRequiredFields(data, ['phoneNumber']);
    validatePhoneNumber(data.phoneNumber);

    const otp = generateOTP();
    this.#otpStore.set(data.phoneNumber, otp);

    return formatSuccessResponse([
      { codeOtp: otp }
    ]);
  }

  /**
   * 13. Wallet to Wallet Transfer - Confirmation
   */
  async walletTransferConfirmation(data) {
    validateRequiredFields(data, ['otp', 'contractId', 'amout', 'destinationPhone']);

    const sourceWallet = this.#wallets.get(data.contractId);
    if (!sourceWallet) {
      throw new ContractNotFoundError('Source wallet not found');
    }

    const storedOTP = this.#otpStore.get(data.contractId);
    if (data.otp !== storedOTP) {
      throw new InvalidOTPError('Invalid OTP');
    }

    const destWallet = this.#wallets.get(data.destinationPhone);
    if (!destWallet) {
      throw new ContractNotFoundError('Destination wallet not found');
    }

    const amount = parseFloat(data.amout);
    const feeAmount = amount * 0.05;
    const taxAmount = feeAmount * 0.20;
    const totalFees = feeAmount + taxAmount;
    const totalAmount = amount + totalFees;

    if (sourceWallet.balance < totalAmount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    // Execute transfer
    sourceWallet.balance -= totalAmount;
    destWallet.balance += amount;
    sourceWallet.lastUpdated = new Date();
    destWallet.lastUpdated = new Date();

    const referenceId = generateTransactionReference();

    this.#transactions.set(referenceId, {
      contractId: data.contractId,
      sourceContractId: data.contractId,
      destinationContractId: destWallet.contractId,
      amount,
      fees: totalFees,
      totalFees,
      type: 'TT',
      date: new Date().toISOString(),
      referenceId,
      status: '000',
      isCanceled: false,
      clientNote: data.clientNote || '',
    });

    this.#otpStore.delete(data.contractId);

    return formatSuccessResponse({
      item1: {
        value: sourceWallet.balance.toFixed(3)
      },
      item2: '000',
      item3: 'Successful',
    });
  }

  /**
   * 14. Bank Transfer - Simulation
   */
  async bankTransferSimulation(data) {
    validateRequiredFields(data, ['Amount', 'RIB']);
    validateRIB(data.RIB);
    validateAmount(data.Amount);

    const amount = parseFloat(data.Amount);
    const fees = 0; // Bank transfers typically have no fees in mock

    return formatSuccessResponse([{
      frais: fees.toFixed(2),
      totalAmountWithFee: amount.toFixed(2),
      montantFrais: fees,
      montantTVA: 0,
      montantFraisTotal: fees,
    }]);
  }

  /**
   * 15. Bank Transfer - OTP
   */
  async bankTransferOTP(data) {
    return formatSuccessResponse('123456');
  }

  /**
   * 16. Bank Transfer - Confirmation
   */
  async bankTransferConfirmation(data) {
    validateRequiredFields(data, ['Otp', 'ContractId', 'Amount']);

    if (data.Otp !== '123456') {
      throw new InvalidOTPError('Invalid OTP');
    }

    const wallet = this.#wallets.get(data.ContractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    const amount = parseFloat(data.Amount);
    if (wallet.balance < amount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.lastUpdated = new Date();

    const reference = generateTransactionReference();

    this.#transactions.set(reference, {
      contractId: data.ContractId,
      amount,
      fees: 0,
      totalFees: 0,
      type: 'VIREMENT',
      date: new Date().toISOString(),
      referenceId: reference,
      status: '000',
      isCanceled: false,
      rib: data.RIB,
    });

    return formatSuccessResponse({
      contractId: data.ContractId,
      reference,
    });
  }

  /**
   * Helper: Find wallet by contract ID
   */
  findWalletByContractId(contractId) {
    return this.#wallets.get(contractId);
  }

  /**
   * Helper: Get all wallets (for debugging)
   */
  getAllWallets() {
    return Array.from(this.#wallets.values());
  }

  /**
   * Helper: Get all transactions (for debugging)
   */
  getAllTransactions() {
    return Array.from(this.#transactions.values());
  }

  /**
   * 17. ATM Withdrawal - Simulation
   */
  async atmWithdrawalSimulation(data) {
    validateRequiredFields(data, ['ContractId', 'Amount']);
    validateAmount(data.Amount);

    const wallet = this.#wallets.get(data.ContractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    const amount = parseFloat(data.Amount);
    const feeAmount = 3.00;
    const taxAmount = 0.27;
    const totalFees = feeAmount + taxAmount;
    const totalAmount = amount + totalFees;

    if (wallet.balance < totalAmount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    const token = generateHexToken();
    const referenceId = generateTransactionReference();

    return formatSuccessResponse({
      totalFrai: totalFees.toFixed(2),
      feeDetails: `Nature:"COM",InvariantFee:${feeAmount},VariantFee:0.0,Nature:"TVA",InvariantFee:0.000,VariantFee:${taxAmount}`,
      token,
      totalAmount: totalAmount.toFixed(2),
      referenceId,
    });
  }

  /**
   * 18. ATM Withdrawal - OTP
   */
  async atmWithdrawalOTP(data) {
    return formatSuccessResponse([
      { codeOtp: generateOTP() }
    ]);
  }

  /**
   * 19. ATM Withdrawal - Confirmation
   */
  async atmWithdrawalConfirmation(data) {
    validateRequiredFields(data, ['Otp', 'Token', 'ContractId', 'Amount']);

    if (data.Otp !== '123456') {
      throw new InvalidOTPError('Invalid OTP');
    }

    const wallet = this.#wallets.get(data.ContractId);
    if (!wallet) {
      throw new ContractNotFoundError('Contract not found');
    }

    const amount = parseFloat(data.Amount);
    const feeAmount = 3.00;
    const taxAmount = 0.27;
    const totalFees = feeAmount + taxAmount;
    const totalAmount = amount + totalFees;

    if (wallet.balance < totalAmount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    wallet.balance -= totalAmount;
    wallet.lastUpdated = new Date();

    const transactionId = generateTransactionId();
    const reference = generateTransactionReference();

    this.#transactions.set(reference, {
      contractId: data.ContractId,
      amount,
      fees: totalFees,
      totalFees,
      type: 'GAB',
      date: new Date().toISOString(),
      referenceId: reference,
      status: '000',
      isCanceled: false,
    });

    return formatSuccessResponse({
      fee: totalFees.toFixed(2),
      token: data.Token,
      amount,
      transactionReference: reference,
      cardId: data.ContractId,
      transactionId,
      transfertCihExpressReference: `00${Date.now()}`,
      redCode: null,
      greenCode: null,
    });
  }

  /**
   * 20. Wallet to Merchant Payment - Simulation
   */
  async walletToMerchantSimulation(data) {
    validateRequiredFields(data, ['clientContractId', 'Amout', 'merchantPhoneNumber']);
    validateAmount(data.Amount);

    const sourceWallet = this.#wallets.get(data.clientContractId);
    if (!sourceWallet) {
      throw new ContractNotFoundError('Source wallet not found');
    }

    const merchant = this.#merchants.get(data.merchantPhoneNumber);
    if (!merchant) {
      throw new ContractNotFoundError('Merchant not found');
    }

    const amount = parseFloat(data.Amount);
    const referenceId = generateTransactionReference();

    return formatSuccessResponse({
      amount: data.Amount,
      beneficiaryFirstName: merchant.firstName,
      beneficiaryLastName: merchant.lastName,
      referenceId,
      totalAmount: amount.toFixed(2),
      totalFrai: '0.00',
      type: 'TM',
      isCanceled: false,
    });
  }

  /**
   * 21. Wallet to Merchant Payment - OTP
   */
  async walletToMerchantOTP(data) {
    return formatSuccessResponse([
      { codeOtp: generateOTP() }
    ]);
  }

  /**
   * 22. Wallet to Merchant Payment - Confirmation
   */
  async walletToMerchantConfirmation(data) {
    validateRequiredFields(data, ['OTP', 'clientContractId', 'Amout', 'merchantPhoneNumber']);

    if (data.OTP !== '123456') {
      throw new InvalidOTPError('Invalid OTP');
    }

    const sourceWallet = this.#wallets.get(data.clientContractId);
    if (!sourceWallet) {
      throw new ContractNotFoundError('Source wallet not found');
    }

    const merchant = this.#merchants.get(data.merchantPhoneNumber);
    if (!merchant) {
      throw new ContractNotFoundError('Merchant not found');
    }

    const amount = parseFloat(data.Amount);
    if (sourceWallet.balance < amount) {
      throw new InsufficientBalanceError('Insufficient balance');
    }

    sourceWallet.balance -= amount;
    merchant.balance += amount;
    sourceWallet.lastUpdated = new Date();
    merchant.lastUpdated = new Date();

    const referenceId = generateTransactionReference();

    this.#transactions.set(referenceId, {
      contractId: data.clientContractId,
      sourceContractId: data.clientContractId,
      destinationContractId: merchant.contractId,
      amount,
      fees: 0,
      totalFees: 0,
      type: 'TM',
      date: new Date().toISOString(),
      referenceId,
      status: '000',
      isCanceled: false,
    });

    return formatSuccessResponse({
      item1: {
        value: sourceWallet.balance.toFixed(3)
      },
      item2: '000',
      item3: 'Successful',
    });
  }

  /**
   * 23. Merchant Pre-Creation
   */
  async merchantPreCreate(data) {
    validateRequiredFields(data, ['FirstName', 'LastName', 'MobileNumber', 'CompanyName']);
    validatePhoneNumber(data.MobileNumber);

    const token = generateMerchantToken();

    this.#tokens.set(token, {
      ...data,
      type: 'merchant',
      createdAt: new Date(),
    });

    this.log('📝 [MOCK WALLET] Merchant pre-creation', { companyName: data.CompanyName, token });

    return formatSuccessResponse({
      token,
    });
  }

  /**
   * 24. Merchant Activation
   */
  async merchantActivate(data) {
    validateRequiredFields(data, ['Token', 'Otp']);

    const tokenData = this.#tokens.get(data.Token);
    if (!tokenData || tokenData.type !== 'merchant') {
      throw new ValidationError('Invalid or expired token');
    }

    if (data.Otp !== '123456') {
      throw new InvalidOTPError('Invalid OTP');
    }

    const contractId = generateContractId('MER');
    const rib = generateRIB();

    const merchant = {
      contractId,
      rib,
      phoneNumber: tokenData.MobileNumber,
      firstName: tokenData.FirstName,
      lastName: tokenData.LastName,
      companyName: tokenData.CompanyName,
      commercialRegistrationNumber: tokenData.CommercialRegistrationNumber || '',
      balance: 0,
      level: '000',
      status: 'active',
      createdAt: new Date(),
    };

    this.#merchants.set(contractId, merchant);
    this.#merchants.set(tokenData.MobileNumber, merchant);

    this.#tokens.delete(data.Token);

    this.log('✅ [MOCK WALLET] Merchant activated', { contractId, companyName: tokenData.CompanyName });

    return formatSuccessResponse({
      contractId,
    });
  }

  /**
   * 25. Dynamic QR Code Generation
   */
  async generateDynamicQRCode(data) {
    validateRequiredFields(data, ['phoneNumber', 'contractId', 'amount']);
    validatePhoneNumber(data.phoneNumber);
    validateAmount(data.amount);

    const token = `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    
    // Mock base64 QR code (simplified)
    const mockQRBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    // Generate EMV QR code format
    const qrData = `00020101021226${data.phoneNumber}${data.contractId}5303504540310${data.amount}5802MA`;

    return formatSuccessResponse({
      phoneNumber: data.phoneNumber,
      reference: '',
      token,
      base64Content: mockQRBase64,
      binaryContent: qrData,
    });
  }

  /**
   * Helper: Reset all data (for testing)
   */
  reset() {
    this.#wallets.clear();
    this.#merchants.clear();
    this.#transactions.clear();
    this.#otpStore.clear();
    this.#tokens.clear();
    this.log('🔄 [MOCK WALLET] All data reset');
  }
}

