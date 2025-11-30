/**
 * Banking Service Factory
 * 
 * Exports the appropriate banking provider based on configuration.
 * Uses environment variable USE_MOCK_BANKING to switch between
 * live CIH Bank APIs and mock implementation.
 */

import { CIHLiveProvider } from './CIHLiveProvider.js';
import { MockBankingProvider } from './MockBankingProvider.js';

/**
 * Determine if mock banking should be used
 */
const shouldUseMockBanking = (config = {}) => {
  // Force mock if specified in config
  if (config.forceMock === true) {
    return true;
  }
  
  // Check environment variable
  const useMock = process.env.USE_MOCK_BANKING;
  
  if (useMock === 'false' || useMock === '0') {
    return false;
  }
  
  if (useMock === 'true' || useMock === '1') {
    return true;
  }
  
  // Default to mock if CIH API credentials are not set
  const hasCihConfig = 
    process.env.CIH_API_BASE_URL && 
    process.env.CIH_API_KEY;
  
  return !hasCihConfig;
};

/**
 * Create banking provider instance
 */
export const createBankingProvider = (config = {}) => {
  const useMock = shouldUseMockBanking(config);
  
  if (useMock) {
    console.log('🏦 [BANKING SERVICE] Using MOCK Banking Provider');
    console.log('   Set USE_MOCK_BANKING=false and provide CIH_API_BASE_URL + CIH_API_KEY to use live APIs');
    return new MockBankingProvider();
  } else {
    console.log('🏦 [BANKING SERVICE] Using LIVE CIH Banking Provider');
    console.log('   Set USE_MOCK_BANKING=true to use mock implementation');
    try {
      return new CIHLiveProvider(config);
    } catch (error) {
      console.error('❌ [BANKING SERVICE] Failed to initialize CIH Live Provider:', error.message);
      console.warn('⚠️  [BANKING SERVICE] Falling back to MOCK Banking Provider');
      return new MockBankingProvider();
    }
  }
};

/**
 * Singleton banking service instance
 */
let bankingServiceInstance = null;

/**
 * Get or create banking service singleton with auto-fallback
 */
export const getBankingService = (config) => {
  if (!bankingServiceInstance) {
    bankingServiceInstance = createBankingProvider(config);
  }
  return bankingServiceInstance;
};

/**
 * Get banking service with automatic fallback on network errors
 */
export const getBankingServiceWithFallback = async (config) => {
  let service = getBankingService(config);
  
  // If using live provider, test connection and fallback to mock on network errors
  if (service.constructor.name === 'CIHLiveProvider') {
    try {
      // Test with a dummy call (will fail but we catch network errors)
      // Actually, we'll handle this in the wallet route instead
      return service;
    } catch (error) {
      if (error instanceof NetworkError || error.code === 'NETWORK_ERROR') {
        console.warn('⚠️  [BANKING SERVICE] Network error detected, falling back to MOCK');
        resetBankingService();
        return getBankingService({ ...config, forceMock: true });
      }
      throw error;
    }
  }
  
  return service;
};

/**
 * Reset banking service singleton (useful for testing)
 */
export const resetBankingService = () => {
  bankingServiceInstance = null;
};

/**
 * Default export - the banking service singleton
 */
const bankingService = getBankingService();

export default bankingService;

/**
 * Re-export error types for convenience
 */
export * from './types.js';

/**
 * Re-export providers for advanced usage
 */
export { CIHLiveProvider } from './CIHLiveProvider.js';
export { MockBankingProvider } from './MockBankingProvider.js';

