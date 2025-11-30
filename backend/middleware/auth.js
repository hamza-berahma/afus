import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { apiConfig } from '../config/api.js';

// JWT Configuration
const JWT_SECRET = apiConfig.jwt.secret;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload { userId, email, role }
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  const { userId, email, role } = payload;
  
  if (!userId || !email || !role) {
    throw new Error('Missing required token payload fields: userId, email, role');
  }
  
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload { userId, email, role }
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const { userId, email, role } = payload;
  
  if (!userId || !email || !role) {
    throw new Error('Missing required token payload fields: userId, email, role');
  }
  
  return jwt.sign(
    { userId, email, role, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} payload - Token payload { userId, email, role }
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches user to req.user
 */
export const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required',
      error: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = verifyToken(token);
    
    // Don't allow refresh tokens as access tokens
    if (decoded.type === 'refresh') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token type',
        error: 'INVALID_TOKEN_TYPE'
      });
    }
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid or expired token',
      error: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware to check user role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid role configuration',
        error: 'INVALID_ROLE_CONFIG'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Insufficient permissions. This action requires one of: ${allowedRoles.join(', ')}. Your current role is: ${req.user.role || 'none'}`,
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role || 'none',
        hint: req.user.role === 'BUYER' 
          ? 'You need a PRODUCER account to perform this action. Please register as a producer or use a producer account.'
          : req.user.role === 'PRODUCER'
          ? 'You need a BUYER account to perform this action. Please use a buyer account.'
          : 'Please check your account role and try again.'
      });
    }
    
    next();
  };
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  const saltRounds = 12;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Legacy export for backward compatibility
export const authenticateToken = verifyTokenMiddleware;
