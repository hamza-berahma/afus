import express from 'express';
import User from '../db/models/User.js';
import {
  generateTokens,
  verifyToken,
  generateAccessToken,
  verifyTokenMiddleware,
  hashPassword,
  comparePassword,
} from '../middleware/auth.js';
import { activateClientAccount, CIHApiError } from '../services/cihApi.js';

const router = express.Router();

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Basic phone validation - adjust regex as needed
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 8 characters, at least one letter and one number
  return password && password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};

const validateRole = (role) => {
  const validRoles = ['BUYER', 'PRODUCER', 'ADMIN'];
  return validRoles.includes(role);
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;

    // Validate inputs
    if (!email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, phone, password, role',
        error: 'MISSING_FIELDS',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL',
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format',
        error: 'INVALID_PHONE',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain both letters and numbers',
        error: 'INVALID_PASSWORD',
      });
    }

    if (!validateRole(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: BUYER, PRODUCER, ADMIN',
        error: 'INVALID_ROLE',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          error: 'EMAIL_EXISTS',
        });
      }
      if (existingUser.phone === phone) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists',
          error: 'PHONE_EXISTS',
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    const user = await User.create({
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role,
    });

    // Automatically activate wallet
    let walletId = null;
    try {
      const activationData = await activateClientAccount({
        phone: user.phone,
        email: user.email,
      });
      
      walletId = activationData.walletId || activationData.contractId;
      
      // Update user with wallet ID
      await User.findByIdAndUpdate(user.id, {
        $set: { walletId },
      });
      
      user.walletId = walletId;
      console.log(`✅ Wallet auto-activated for user ${user.id}: ${walletId}`);
    } catch (error) {
      // Log error but don't fail registration
      console.error('⚠️  Wallet activation failed during registration:', error.message);
      // User can still register and activate wallet manually later
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and tokens (exclude passwordHash)
    res.status(201).json({
      success: true,
      message: 'User registered successfully' + (walletId ? ' (wallet activated)' : ' (wallet activation pending)'),
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletId: walletId || null,
          createdAt: user.createdAt,
        },
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
        error: `${field.toUpperCase()}_EXISTS`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: 'REGISTRATION_ERROR',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user with email/phone and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validate inputs
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        error: 'MISSING_PASSWORD',
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone is required',
        error: 'MISSING_CREDENTIALS',
      });
    }

    // Find user by email or phone
    let user;
    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL',
        });
      }
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      if (!validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone format',
          error: 'INVALID_PHONE',
        });
      }
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Auto-activate wallet if not already activated
    if (!user.walletId) {
      try {
        const activationData = await activateClientAccount({
          phone: user.phone,
          email: user.email,
          name: user.name || undefined,
        });
        
        const walletId = activationData.walletId || activationData.contractId;
        
        // Update user with wallet ID
        await User.findByIdAndUpdate(user.id, {
          $set: { walletId },
        });
        
        user.walletId = walletId;
        console.log(`✅ Wallet auto-activated for user ${user.id} on login: ${walletId}`);
      } catch (error) {
        // Log error but don't fail login
        console.error('⚠️  Wallet activation failed during login:', error.message);
      }
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and tokens (exclude passwordHash)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletId: user.walletId || null,
          createdAt: user.createdAt,
        },
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: 'LOGIN_ERROR',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired refresh token',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: 'INVALID_TOKEN_TYPE',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
      error: 'REFRESH_ERROR',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user data
 */
router.get('/me', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user from database
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletId: user.walletId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_USER_ERROR',
    });
  }
});

export default router;
