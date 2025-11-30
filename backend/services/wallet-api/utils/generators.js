/**
 * Utility functions for generating tokens, RIBs, OTPs, etc.
 */

/**
 * Generate a unique transaction token
 */
export function generateToken(prefix = 'TR') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Generate a 24-digit RIB (Relevé d'Identité Bancaire)
 */
export function generateRIB() {
  return Array.from({ length: 24 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
}

/**
 * Generate a contract ID
 */
export function generateContractId(prefix = 'LAN') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Generate a transaction ID
 */
export function generateTransactionId() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a transaction reference
 */
export function generateTransactionReference() {
  return String(Math.floor(Math.random() * 1000000000000));
}

/**
 * Generate a mock OTP (for development)
 */
export function generateOTP() {
  return '123456'; // Mock OTP for hackathon
}

/**
 * Generate a 32-character hex token
 */
export function generateHexToken() {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

/**
 * Generate merchant token
 */
export function generateMerchantToken() {
  return generateToken('ME');
}

