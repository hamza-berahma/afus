import dotenv from 'dotenv';

dotenv.config();

// API Configuration
export const apiConfig = {
  // Payment API Configuration (using internal mock system)
  cih: {
    baseUrl: '', // Not used - using mock API
    apiKey: '', // Not used - using mock API
    holdingWalletId: process.env.CIH_HOLDING_WALLET_ID || 'holding-wallet-001', // Used for escrow
  },
  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
  },
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  },
};

// Validate required API configurations
export const validateApiConfig = () => {
  const missing = [];
  const useMockCih = process.env.USE_MOCK_CIH_API === 'true' || !apiConfig.cih.baseUrl;
  
  // Only require CIH API config if not using mock
  if (!useMockCih) {
    if (!apiConfig.cih.baseUrl) missing.push('CIH_API_BASE_URL');
    if (!apiConfig.cih.apiKey) missing.push('CIH_API_KEY');
  }
  
  if (!apiConfig.twilio.accountSid) missing.push('TWILIO_ACCOUNT_SID');
  if (!apiConfig.twilio.authToken) missing.push('TWILIO_AUTH_TOKEN');
  if (!apiConfig.jwt.secret || apiConfig.jwt.secret === 'your-secret-key') {
    console.warn('Warning: JWT_SECRET is not set or using default value');
  }
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
};

export default apiConfig;

