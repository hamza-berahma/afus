/**
 * Input validation utilities
 */

import { ValidationError, InvalidPhoneNumberError } from '../types.js';

/**
 * Validate phone number format (212XXXXXXXXX)
 */
export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    throw new ValidationError('Phone number is required');
  }

  const phoneRegex = /^212[0-9]{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new InvalidPhoneNumberError(
      'Phone number must be in format 212XXXXXXXXX'
    );
  }

  return true;
}

/**
 * Validate RIB format (24 digits)
 */
export function validateRIB(rib) {
  if (!rib) {
    throw new ValidationError('RIB is required');
  }

  if (!/^\d{24}$/.test(rib)) {
    throw new ValidationError('RIB must be exactly 24 digits');
  }

  return true;
}

/**
 * Validate amount
 */
export function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new ValidationError('Amount is required');
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }

  return numAmount;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email) return true; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  return true;
}

/**
 * Validate date format (DDMMYYYY)
 */
export function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return true; // Optional
  
  if (!/^\d{8}$/.test(dateOfBirth)) {
    throw new ValidationError('Date of birth must be in format DDMMYYYY');
  }

  return true;
}

