import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Favorite from '../db/models/Favorite.js';
import Product from '../db/models/Product.js';

const router = express.Router();

/**
 * GET /api/favorites
 * Get all favorite products for the current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'productId',
        populate: {
          path: 'cooperativeId',
          model: 'Cooperative',
        },
      })
      .sort({ createdAt: -1 });

    // Filter out deleted products
    const validFavorites = favorites.filter(
      (fav) => fav.productId && !fav.productId.deletedAt
    );

    res.json({
      success: true,
      data: validFavorites.map((fav) => ({
        id: fav.id,
        product: fav.productId,
        createdAt: fav.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch favorites',
    });
  }
});

/**
 * POST /api/favorites/:productId
 * Add a product to favorites
 */
router.post('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    // Check if product exists and is not deleted
    const product = await Product.findOne({
      _id: productId,
      deletedAt: null,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, productId });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_FAVORITED',
        message: 'Product is already in favorites',
      });
    }

    // Create favorite
    const favorite = await Favorite.create({ userId, productId });

    res.status(201).json({
      success: true,
      message: 'Product added to favorites',
      data: {
        id: favorite.id,
        productId: favorite.productId.toString(),
        createdAt: favorite.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        error: 'ALREADY_FAVORITED',
        message: 'Product is already in favorites',
      });
    }

    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to add favorite',
    });
  }
});

/**
 * DELETE /api/favorites/:productId
 * Remove a product from favorites
 */
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ userId, productId });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'FAVORITE_NOT_FOUND',
        message: 'Favorite not found',
      });
    }

    res.json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to remove favorite',
    });
  }
});

/**
 * GET /api/favorites/check/:productId
 * Check if a product is favorited by the current user
 */
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const favorite = await Favorite.findOne({ userId, productId });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
      },
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to check favorite status',
    });
  }
});

/**
 * GET /api/favorites/ids
 * Get list of favorited product IDs for the current user
 * Useful for bulk checking favorite status
 */
router.get('/ids', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const favorites = await Favorite.find({ userId }).select('productId');

    res.json({
      success: true,
      data: {
        productIds: favorites.map((fav) => fav.productId.toString()),
      },
    });
  } catch (error) {
    console.error('Error fetching favorite IDs:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch favorite IDs',
    });
  }
});

export default router;

