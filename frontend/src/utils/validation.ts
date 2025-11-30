/**
 * Validation utility functions
 */

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (Morocco format)
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const trimmed = phone.trim();
  const patterns = [
    /^\+212[5-9]\d{8}$/,
    /^0[5-9]\d{8}$/,
    /^212[5-9]\d{8}$/,
  ];
  
  return patterns.some((pattern) => pattern.test(trimmed));
};

/**
 * Validate password
 */
export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  if (password.length < 8) {
    return false;
  }
  
  if (!/\d/.test(password)) {
    return false;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  
  return true;
};

/**
 * Validate amount (positive number)
 */
export const validateAmount = (amount: number | string): boolean => {
  if (amount === null || amount === undefined || amount === '') {
    return false;
  }
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return false;
  }
  
  if (num <= 0) {
    return false;
  }
  
  return true;
};

/**
 * Validate required field
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (typeof value === 'number') {
    return true;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return !!value;
};

/**
 * Get validation error message for email
 */
export const getEmailError = (email: string): string | null => {
  if (!validateRequired(email)) {
    return 'Email is required';
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

/**
 * Get validation error message for phone
 */
export const getPhoneError = (phone: string): string | null => {
  if (!validateRequired(phone)) {
    return 'Phone number is required';
  }
  if (!validatePhone(phone)) {
    return 'Please enter a valid Moroccan phone number (e.g., +212612345678 or 0612345678)';
  }
  return null;
};

/**
 * Get validation error message for password
 */
export const getPasswordError = (password: string): string | null => {
  if (!validateRequired(password)) {
    return 'Password is required';
  }
  if (!validatePassword(password)) {
    return 'Password must be at least 8 characters with 1 number and 1 special character';
  }
  return null;
};

/**
 * Get validation error message for amount
 */
export const getAmountError = (amount: number | string): string | null => {
  if (!validateRequired(amount)) {
    return 'Amount is required';
  }
  if (!validateAmount(amount)) {
    return 'Amount must be a positive number';
  }
  return null;
};

/**
 * Get validation error message for required field
 */
export const getRequiredError = (value: any, fieldName: string = 'This field'): string | null => {
  if (!validateRequired(value)) {
    return `${fieldName} is required`;
  }
  return null;
};

