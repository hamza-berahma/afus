/**
 * Credit Score API Routes
 * 
 * GET /api/credit-score/me - Get current user's credit score
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import CreditScoreService from '../services/CreditScoreService.js';

const router = express.Router();

/**
 * GET /api/credit-score/me
 * Get current user's Ma3qoul Score (Trust Score)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Only producers can have credit scores
    if (req.user.role !== 'PRODUCER') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Credit scores are only available for producers',
          code: 'NOT_PRODUCER',
        },
      });
    }

    const scoreResult = await CreditScoreService.calculateScore(userId);

    res.json({
      success: true,
      data: scoreResult,
    });
  } catch (error) {
    console.error('Credit score calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to calculate credit score',
        code: 'CALCULATION_ERROR',
      },
    });
  }
});

/**
 * GET /api/credit-score/:userId
 * Get credit score for a specific user (admin only)
 */
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    // Only admins can view other users' scores
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Unauthorized: Admin access required',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const userId = req.params.userId;
    const scoreResult = await CreditScoreService.calculateScore(userId);

    res.json({
      success: true,
      data: scoreResult,
    });
  } catch (error) {
    console.error('Credit score calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to calculate credit score',
        code: 'CALCULATION_ERROR',
      },
    });
  }
});

export default router;

