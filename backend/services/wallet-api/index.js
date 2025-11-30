/**
 * Wallet API Service Factory
 * 
 * Exports the appropriate wallet provider based on configuration.
 * Uses environment variable USE_MOCK_WALLET_API to switch between
 * live CIH Wallet APIs and mock implementation.
 */

import { CIHWalletProvider } from './CIHWalletProvider.js';
import { MockWalletProvider } from './MockWalletProvider.js';

/**
 * Determine if mock wallet API should be used
 */
const shouldUseMockWallet = (config = {}) => {
  // Force mock if specified in config
  if (config.forceMock === true) {
    return true;
  }

  // Check environment variable
  const useMock = process.env.USE_MOCK_WALLET_API;

  if (useMock === 'false' || useMock === '0') {
    return false;
  }

  if (useMock === 'true' || useMock === '1') {
    return true;
  }

  // Default to mock if CIH Wallet API credentials are not set
  const hasCihConfig =
    process.env.CIH_WALLET_API_BASE_URL &&
    process.env.CIH_WALLET_API_KEY;

  return !hasCihConfig;
};

/**
 * Create wallet provider instance
 */
export const createWalletProvider = (config = {}) => {
  const useMock = shouldUseMockWallet(config);

  if (useMock) {
    console.log('💳 [WALLET API SERVICE] Using MOCK Wallet Provider');
    console.log('   Set USE_MOCK_WALLET_API=false and provide CIH_WALLET_API_BASE_URL + CIH_WALLET_API_KEY to use live APIs');
    return new MockWalletProvider();
  } else {
    console.log('💳 [WALLET API SERVICE] Using LIVE CIH Wallet Provider');
    console.log('   Set USE_MOCK_WALLET_API=true to use mock implementation');
    try {
      return new CIHWalletProvider(config);
    } catch (error) {
      console.error('❌ [WALLET API SERVICE] Failed to initialize CIH Live Provider:', error.message);
      console.warn('⚠️  [WALLET API SERVICE] Falling back to MOCK Wallet Provider');
      return new MockWalletProvider();
    }
  }
};

/**
 * Singleton wallet service instance
 */
let walletServiceInstance = null;

/**
 * Get or create wallet service singleton
 */
export const getWalletService = (config) => {
  if (!walletServiceInstance) {
    walletServiceInstance = createWalletProvider(config);
  }
  return walletServiceInstance;
};

/**
 * Reset wallet service singleton (useful for testing)
 */
export const resetWalletService = () => {
  walletServiceInstance = null;
};

/**
 * Default export - the wallet service singleton
 */
const walletService = getWalletService();

export default walletService;

/**
 * Re-export error types for convenience
 */
export * from './types.js';

/**
 * Re-export providers for advanced usage
 */
export { CIHWalletProvider } from './CIHWalletProvider.js';
export { MockWalletProvider } from './MockWalletProvider.js';

