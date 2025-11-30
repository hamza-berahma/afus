import express from 'express';
import Cooperative from '../db/models/Cooperative.js';
import User from '../db/models/User.js';
import Product from '../db/models/Product.js';
import Transaction from '../db/models/Transaction.js';
import { verifyTokenMiddleware, roleCheck } from '../middleware/auth.js';
import { createMerchantAccount, CIHApiError } from '../services/cihApi.js';

const router = express.Router();

/**
 * POST /api/cooperatives/register
 * Register a new cooperative
 */
router.post('/register', verifyTokenMiddleware, roleCheck(['PRODUCER']), async (req, res) => {
  try {
    const { name, registration_number, region, latitude, longitude, address, documents } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!name || !registration_number) {
      return res.status(400).json({
        success: false,
        message: 'name and registration_number are required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    // Check if user already has a cooperative
    const existingCooperative = await Cooperative.findOne({ userId });

    if (existingCooperative) {
      return res.status(400).json({
        success: false,
        message: 'User already has a registered cooperative',
        error: 'COOPERATIVE_EXISTS',
        data: {
          cooperativeId: existingCooperative.id,
        },
      });
    }

    // Check if registration number is already taken
    const existingRegistration = await Cooperative.findOne({ registrationNumber: registration_number });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Cooperative with this registration number already exists',
        error: 'REGISTRATION_NUMBER_EXISTS',
      });
    }

    // Get user details for CIH API
    const user = await User.findById(userId).select('email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    // Call CIH API to create merchant account
    let merchantAccount;
    try {
      merchantAccount = await createMerchantAccount({
        name,
        registrationNumber: registration_number,
        phone: user.phone,
        email: user.email,
        region: region || null,
      });
    } catch (error) {
      if (error instanceof CIHApiError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
          error: 'CIH_API_ERROR',
        });
      }
      throw error;
    }

    // Create cooperative in database
    const cooperative = await Cooperative.create({
      name,
      userId,
      registrationNumber: registration_number,
      region: region || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address || null,
    });

    res.status(201).json({
      success: true,
      message: 'Cooperative registered successfully',
      data: {
        cooperative: {
          id: cooperative.id,
          name: cooperative.name,
          registrationNumber: cooperative.registrationNumber,
          region: cooperative.region,
          latitude: cooperative.latitude,
          longitude: cooperative.longitude,
          address: cooperative.address,
          createdAt: cooperative.createdAt,
        },
        merchantAccount: {
          merchantId: merchantAccount.merchantId,
          walletId: merchantAccount.walletId,
          contractId: merchantAccount.contractId,
        },
      },
    });
  } catch (error) {
    console.error('Register cooperative error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Cooperative with this ${field} already exists`,
        error: `${field.toUpperCase()}_EXISTS`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'REGISTER_COOPERATIVE_ERROR',
    });
  }
});

/**
 * GET /api/cooperatives
 * Get list of cooperatives with filters
 */
router.get('/', async (req, res) => {
  try {
    const { region, search, limit = 20, offset = 0, latitude, longitude, radius } = req.query;

    // Validate pagination
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        error: 'INVALID_LIMIT',
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset must be non-negative',
        error: 'INVALID_OFFSET',
      });
    }

    // Build query with filters
    const query = {};

    // Filter by region
    if (region) {
      query.region = region;
    }

    // Search filter (name, registration number, region, or address)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // Location-based filtering (find cooperatives within radius)
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius) || 50; // Default 50km radius
      
      // MongoDB geospatial query using bounding box
      // For production, consider using MongoDB's $geoNear aggregation with 2dsphere index
      const latRange = radiusKm / 111; // Approximate km per degree latitude
      const lngRange = radiusKm / (111 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      query.latitude = {
        $gte: lat - latRange,
        $lte: lat + latRange,
        $ne: null,
      };
      query.longitude = {
        $gte: lng - lngRange,
        $lte: lng + lngRange,
        $ne: null,
      };
    } else if (latitude && longitude) {
      // If only lat/lng provided without radius, filter to cooperatives with location data
      query.latitude = { $ne: null };
      query.longitude = { $ne: null };
    }

    // Get cooperatives with user info
    const cooperatives = await Cooperative.find(query)
      .populate('userId', 'email phone')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .lean();

    // Get total count
    const total = await Cooperative.countDocuments(query);

    // Format cooperatives
    const formattedCooperatives = cooperatives.map((coop) => ({
      id: coop._id.toString(),
      name: coop.name,
      registrationNumber: coop.registrationNumber,
      region: coop.region,
      latitude: coop.latitude,
      longitude: coop.longitude,
      address: coop.address,
      createdAt: coop.createdAt,
      producer: coop.userId ? {
        id: coop.userId._id.toString(),
        email: coop.userId.email,
        phone: coop.userId.phone,
      } : null,
    }));

    res.json({
      success: true,
      data: {
        cooperatives: formattedCooperatives,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error('Get cooperatives error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_COOPERATIVES_ERROR',
    });
  }
});

/**
 * GET /api/cooperatives/:id
 * Get cooperative details with products and stats
 */
router.get('/:id', async (req, res) => {
  try {
    const cooperativeId = req.params.id;

    // Get cooperative details
    const cooperative = await Cooperative.findById(cooperativeId)
      .populate('userId', 'email phone')
      .lean();

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found',
        error: 'COOPERATIVE_NOT_FOUND',
      });
    }

    // Get products count
    const totalProducts = await Product.countDocuments({
      cooperativeId,
      deletedAt: null,
    });

    // Get transactions count (through products)
    const productIds = await Product.find({ cooperativeId }).distinct('_id');
    const totalTransactions = await Transaction.countDocuments({
      productId: { $in: productIds },
    });

    // Calculate cooperative score
    let scoreData = {
      rating: 3.0,
      customerCount: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
    };
    
    try {
      const CooperativeScoreService = (await import('../services/CooperativeScoreService.js')).default;
      scoreData = await CooperativeScoreService.calculateScore(cooperativeId);
    } catch (scoreError) {
      console.error('Error calculating cooperative score:', scoreError);
      // Use default values if score calculation fails
    }

    // Get recent products (limit 10)
    const recentProducts = await Product.find({
      cooperativeId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        cooperative: {
          id: cooperative._id.toString(),
          name: cooperative.name,
          registrationNumber: cooperative.registrationNumber,
          region: cooperative.region,
          latitude: cooperative.latitude,
          longitude: cooperative.longitude,
          address: cooperative.address,
          createdAt: cooperative.createdAt,
        },
        producer: cooperative.userId ? {
          id: cooperative.userId._id.toString(),
          email: cooperative.userId.email,
          phone: cooperative.userId.phone,
        } : null,
        stats: {
          totalProducts,
          totalTransactions,
          rating: scoreData.rating,
          customerCount: scoreData.customerCount,
          successfulTransactions: scoreData.successfulTransactions,
        },
        recentProducts: recentProducts.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          description: p.description,
          price: p.price,
          unit: p.unit,
          stockQuantity: p.stockQuantity,
          imageUrl: p.imageUrl,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get cooperative error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_COOPERATIVE_ERROR',
    });
  }
});

/**
 * GET /api/cooperatives/:id/products
 * Get all products from a cooperative
 */
router.get('/:id/products', async (req, res) => {
  try {
    const cooperativeId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;

    // Validate pagination
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        error: 'INVALID_LIMIT',
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset must be non-negative',
        error: 'INVALID_OFFSET',
      });
    }

    // Verify cooperative exists
    const cooperative = await Cooperative.findById(cooperativeId);

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found',
        error: 'COOPERATIVE_NOT_FOUND',
      });
    }

    // Get products
    const products = await Product.find({
      cooperativeId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .populate('cooperativeId', 'name region')
      .lean();

    // Get total count
    const total = await Product.countDocuments({
      cooperativeId,
      deletedAt: null,
    });

    // Format products
    const formattedProducts = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      stockQuantity: p.stockQuantity,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
    }));

    res.json({
      success: true,
      data: {
        cooperativeId,
        products: formattedProducts,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error('Get cooperative products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_COOPERATIVE_PRODUCTS_ERROR',
    });
  }
});

export default router;
