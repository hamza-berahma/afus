/**
 * Banking Service Factory
 * 
 * Exports the appropriate banking provider based on configuration.
 * Uses environment variable USE_MOCK_BANKING to switch between
 * live CIH Bank APIs and mock implementation.
 */

import { IBankingProvider, ProviderConfig } from './types.js';
import { CIHLiveProvider } from './CIHLiveProvider.js';
import { MockBankingProvider } from './MockBankingProvider.js';

/**
 * Determine if mock banking should be used
 */
const shouldUseMockBanking = (): boolean => {
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
export const createBankingProvider = (config?: ProviderConfig): IBankingProvider => {
  const useMock = shouldUseMockBanking();
  
  if (useMock) {
    console.log('🏦 [BANKING SERVICE] Using MOCK Banking Provider');
    console.log('   Set USE_MOCK_BANKING=false and provide CIH_API_BASE_URL + CIH_API_KEY to use live APIs');
    return new MockBankingProvider();
  } else {
    console.log('🏦 [BANKING SERVICE] Using LIVE CIH Banking Provider');
    console.log('   Set USE_MOCK_BANKING=true to use mock implementation');
    try {
      return new CIHLiveProvider(config);
    } catch (error: any) {
      console.error('❌ [BANKING SERVICE] Failed to initialize CIH Live Provider:', error.message);
      console.warn('⚠️  [BANKING SERVICE] Falling back to MOCK Banking Provider');
      return new MockBankingProvider();
    }
  }
};

/**
 * Singleton banking service instance
 */
let bankingServiceInstance: IBankingProvider | null = null;

/**
 * Get or create banking service singleton
 */
export const getBankingService = (config?: ProviderConfig): IBankingProvider => {
  if (!bankingServiceInstance) {
    bankingServiceInstance = createBankingProvider(config);
  }
  return bankingServiceInstance;
};

/**
 * Reset banking service singleton (useful for testing)
 */
export const resetBankingService = (): void => {
  bankingServiceInstance = null;
};

/**
 * Default export - the banking service singleton
 */
const bankingService = getBankingService();

export default bankingService;

/**
 * Re-export types for convenience
 */
export * from './types.js';

/**
 * Re-export providers for advanced usage
 */
export { CIHLiveProvider } from './CIHLiveProvider.js';
export { MockBankingProvider } from './MockBankingProvider.js';

