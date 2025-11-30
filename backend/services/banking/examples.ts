/**
 * Banking Service Usage Examples
 * 
 * Comprehensive examples demonstrating all banking service features
 */

import bankingService, {
  getBankingService,
  createBankingProvider,
  InsufficientBalanceError,
  ValidationError,
} from './index.js';

/**
 * Example 1: Get Wallet Balance
 */
export async function exampleGetBalance() {
  try {
    const balance = await bankingService.getBalance('contract-123');
    console.log(`✅ Balance: ${balance.balance} ${balance.currency}`);
    return balance;
  } catch (error: any) {
    console.error('❌ Error getting balance:', error.message);
    throw error;
  }
}

/**
 * Example 2: Simulate Transfer (Calculate Fees)
 */
export async function exampleSimulateTransfer() {
  try {
    const simulation = await bankingService.simulateTransfer({
      ContractId: 'contract-123',
      Amount: 500,
      destinationPhone: '+212612345678',
    });

    console.log(`✅ Transfer Simulation:`);
    console.log(`   Amount: ${simulation.breakdown?.amount} MAD`);
    console.log(`   Fee: ${simulation.frais} MAD`);
    console.log(`   Total: ${simulation.totalAmountWithFee} MAD`);

    return simulation;
  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
      console.error('❌ Insufficient balance:', error.details);
    } else {
      console.error('❌ Error simulating transfer:', error.message);
    }
    throw error;
  }
}

/**
 * Example 3: Execute Transfer
 */
export async function exampleExecuteTransfer() {
  try {
    // First, simulate to check fees
    const simulation = await bankingService.simulateTransfer({
      ContractId: 'contract-123',
      Amount: 500,
      destinationPhone: '+212612345678',
    });

    console.log(`💰 Transfer will cost: ${simulation.totalAmountWithFee} MAD`);

    // Then execute
    const result = await bankingService.executeTransfer({
      ContractId: 'contract-123',
      Amount: 500,
      destinationPhone: '+212612345678',
    });

    console.log(`✅ Transfer executed:`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Reference: ${result.reference}`);
    console.log(`   Status: ${result.status}`);

    return result;
  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
      console.error('❌ Insufficient balance:', error.details);
    } else {
      console.error('❌ Error executing transfer:', error.message);
    }
    throw error;
  }
}

/**
 * Example 4: Release Escrow Payment
 */
export async function exampleReleaseEscrow() {
  try {
    const result = await bankingService.releaseEscrow({
      buyerId: 'buyer-contract-123',
      sellerId: 'seller-contract-456',
      amount: 1000,
      transactionId: 'original-tx-789',
    });

    console.log(`✅ Escrow released:`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Reference: ${result.reference}`);
    console.log(`   Buyer balance: ${result.buyerBalance} MAD`);
    console.log(`   Seller balance: ${result.sellerBalance} MAD`);

    return result;
  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
      console.error('❌ Insufficient balance for escrow release:', error.details);
    } else {
      console.error('❌ Error releasing escrow:', error.message);
    }
    throw error;
  }
}

/**
 * Example 5: Cash-In (Deposit)
 */
export async function exampleCashIn() {
  try {
    const result = await bankingService.cashIn({
      ContractId: 'contract-123',
      Amount: 2000,
      method: 'online',
      reference: 'deposit-ref-001',
    });

    console.log(`✅ Cash-in completed:`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Reference: ${result.reference}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Available methods: ${result.availableMethods?.join(', ')}`);

    return result;
  } catch (error: any) {
    console.error('❌ Error with cash-in:', error.message);
    throw error;
  }
}

/**
 * Example 6: Cash-Out (Withdraw)
 */
export async function exampleCashOut() {
  try {
    const result = await bankingService.cashOut({
      ContractId: 'contract-123',
      Amount: 500,
      method: 'atm',
      destination: 'ATM-001',
    });

    console.log(`✅ Cash-out completed:`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Reference: ${result.reference}`);
    console.log(`   Status: ${result.status}`);

    return result;
  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
      console.error('❌ Insufficient balance for cash-out:', error.details);
    } else {
      console.error('❌ Error with cash-out:', error.message);
    }
    throw error;
  }
}

/**
 * Example 7: Complete Purchase Flow with Escrow
 */
export async function exampleCompletePurchaseFlow() {
  try {
    const buyerId = 'buyer-contract-123';
    const sellerId = 'seller-contract-456';
    const purchaseAmount = 750;

    console.log('🛒 Starting purchase flow...\n');

    // Step 1: Check buyer balance
    console.log('1️⃣ Checking buyer balance...');
    const buyerBalance = await bankingService.getBalance(buyerId);
    console.log(`   Buyer balance: ${buyerBalance.balance} MAD\n`);

    if (buyerBalance.balance < purchaseAmount) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${buyerBalance.balance} MAD, Required: ${purchaseAmount} MAD`
      );
    }

    // Step 2: Simulate transfer to calculate fees
    console.log('2️⃣ Simulating transfer to calculate fees...');
    const simulation = await bankingService.simulateTransfer({
      ContractId: buyerId,
      Amount: purchaseAmount,
      destinationPhone: sellerId,
    });
    console.log(`   Total with fees: ${simulation.totalAmountWithFee} MAD\n`);

    // Step 3: Execute transfer (escrow)
    console.log('3️⃣ Executing transfer (escrow)...');
    const transferResult = await bankingService.executeTransfer({
      ContractId: buyerId,
      Amount: purchaseAmount,
      destinationPhone: sellerId,
    });
    console.log(`   Transaction ID: ${transferResult.transactionId}\n`);

    // Step 4: Verify balances
    console.log('4️⃣ Verifying balances...');
    const updatedBuyerBalance = await bankingService.getBalance(buyerId);
    const updatedSellerBalance = await bankingService.getBalance(sellerId);
    console.log(`   Buyer balance: ${updatedBuyerBalance.balance} MAD`);
    console.log(`   Seller balance: ${updatedSellerBalance.balance} MAD\n`);

    // Step 5: Release escrow (after delivery confirmation)
    console.log('5️⃣ Releasing escrow payment...');
    const escrowResult = await bankingService.releaseEscrow({
      buyerId: buyerId,
      sellerId: sellerId,
      amount: purchaseAmount,
      transactionId: transferResult.transactionId,
    });
    console.log(`   Escrow released: ${escrowResult.transactionId}\n`);

    // Step 6: Final balances
    console.log('6️⃣ Final balances:');
    const finalBuyerBalance = await bankingService.getBalance(buyerId);
    const finalSellerBalance = await bankingService.getBalance(sellerId);
    console.log(`   Buyer balance: ${finalBuyerBalance.balance} MAD`);
    console.log(`   Seller balance: ${finalSellerBalance.balance} MAD\n`);

    console.log('✅ Purchase flow completed successfully!');

    return {
      transferResult,
      escrowResult,
      finalBuyerBalance,
      finalSellerBalance,
    };
  } catch (error: any) {
    console.error('❌ Purchase flow failed:', error.message);
    if (error.details) {
      console.error('   Details:', error.details);
    }
    throw error;
  }
}

/**
 * Example 8: Using Custom Provider Configuration
 */
export async function exampleCustomProvider() {
  // Create a custom provider with specific configuration
  const customProvider = createBankingProvider({
    baseUrl: 'https://api.cihbank.com',
    apiKey: 'your-api-key',
    timeout: 30000,
    retries: 5,
    enableLogging: true,
  });

  try {
    const balance = await customProvider.getBalance('contract-123');
    console.log(`✅ Balance from custom provider: ${balance.balance} MAD`);
    return balance;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Example 9: Error Handling Patterns
 */
export async function exampleErrorHandling() {
  try {
    await bankingService.executeTransfer({
      ContractId: 'contract-123',
      Amount: 10000, // Large amount that might fail
      destinationPhone: '+212612345678',
    });
  } catch (error: any) {
    // Type-specific error handling
    if (error instanceof InsufficientBalanceError) {
      console.error('💸 Insufficient balance error:');
      console.error(`   Available: ${error.details?.available} MAD`);
      console.error(`   Required: ${error.details?.required} MAD`);
    } else if (error instanceof ValidationError) {
      console.error('📝 Validation error:', error.details);
    } else {
      console.error('⚠️  Other error:', error.message);
    }
    throw error;
  }
}

// Run examples (if executed directly)
if (require.main === module) {
  (async () => {
    console.log('🚀 Running Banking Service Examples\n');
    
    try {
      // Uncomment the example you want to run:
      // await exampleGetBalance();
      // await exampleSimulateTransfer();
      // await exampleExecuteTransfer();
      // await exampleReleaseEscrow();
      // await exampleCashIn();
      // await exampleCashOut();
      // await exampleCompletePurchaseFlow();
      // await exampleCustomProvider();
      // await exampleErrorHandling();
      
      console.log('\n✅ All examples completed!');
    } catch (error) {
      console.error('\n❌ Example failed:', error);
      process.exit(1);
    }
  })();
}

