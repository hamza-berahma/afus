import express from 'express';
import Product from '../db/models/Product.js';
import Cooperative from '../db/models/Cooperative.js';
import User from '../db/models/User.js';
import { verifyTokenMiddleware, roleCheck } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper function to get user's cooperative ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Cooperative ID or null
 */
const getUserCooperative = async (userId) => {
  const cooperative = await Cooperative.findOne({ userId });
  return cooperative ? cooperative._id : null;
};

/**
 * Helper function to verify product belongs to user's cooperative
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Product data
 */
const verifyProductOwnership = async (productId, userId) => {
  const cooperativeId = await getUserCooperative(userId);
  
  if (!cooperativeId) {
    throw new Error('User does not have a cooperative');
  }

  const product = await Product.findOne({
    _id: productId,
    cooperativeId: cooperativeId,
    deletedAt: null,
  });

  if (!product) {
    throw new Error('Product not found or does not belong to your cooperative');
  }

  return product;
};

/**
 * GET /api/products
 * Get paginated products with filters
 */
router.get('/', async (req, res) => {
  try {
    const { region, cooperativeId, search, limit = 20, offset = 0 } = req.query;

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
    const query = { deletedAt: null };

    // Filter by cooperative
    if (cooperativeId) {
      query.cooperativeId = cooperativeId;
    }

    // Filter by region (need to join with cooperatives)
    let cooperativeFilter = {};
    if (region) {
      cooperativeFilter.region = region;
    }

    // Search filter (name or description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // If region filter is needed, we need to find cooperatives first
    let cooperativeIds = null;
    if (region) {
      const cooperatives = await Cooperative.find({ region });
      cooperativeIds = cooperatives.map(c => c._id);
      if (cooperativeIds.length === 0) {
        // No cooperatives in this region, return empty result
        return res.json({
          success: true,
          data: {
            products: [],
            pagination: {
              limit: limitNum,
              offset: offsetNum,
              total: 0,
              hasMore: false,
            },
          },
        });
      }
      query.cooperativeId = { $in: cooperativeIds };
    }

    // Get products with cooperative details
    const products = await Product.find(query)
      .populate({
        path: 'cooperativeId',
        select: 'name region registrationNumber',
        model: 'Cooperative',
      })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .lean();

    // Get total count
    const total = await Product.countDocuments(query);

    // Format products
    const formattedProducts = products.map((product) => {
      // Support multiple images (imageUrls array) with backward compatibility for imageUrl
      const imageUrls = product.imageUrls && product.imageUrls.length > 0 
        ? product.imageUrls 
        : (product.imageUrl ? [product.imageUrl] : []);
      
      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        stockQuantity: product.stockQuantity,
        imageUrl: imageUrls[0] || null, // First image for backward compatibility
        imageUrls: imageUrls, // Array of all images (Amazon-style)
        createdAt: product.createdAt,
        cooperative: product.cooperativeId ? {
          id: product.cooperativeId._id.toString(),
          name: product.cooperativeId.name,
          region: product.cooperativeId.region,
          registrationNumber: product.cooperativeId.registrationNumber,
        } : null,
      };
    });

    res.json({
      success: true,
      data: {
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_PRODUCTS_ERROR',
    });
  }
});

/**
 * GET /api/products/:id
 * Get single product details
 */
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findOne({ _id: productId, deletedAt: null })
      .populate({
        path: 'cooperativeId',
        select: 'name region registrationNumber userId',
        model: 'Cooperative',
        populate: {
          path: 'userId',
          select: 'email phone',
          model: 'User',
        },
      })
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    // Support multiple images with backward compatibility
    const imageUrls = product.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : (product.imageUrl ? [product.imageUrl] : []);

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          unit: product.unit,
          stockQuantity: product.stockQuantity,
          imageUrl: imageUrls[0] || null, // First image for backward compatibility
          imageUrls: imageUrls, // Array of all images (Amazon-style)
          createdAt: product.createdAt,
        },
        cooperative: product.cooperativeId ? {
          id: product.cooperativeId._id.toString(),
          name: product.cooperativeId.name,
          region: product.cooperativeId.region,
          registrationNumber: product.cooperativeId.registrationNumber,
        } : null,
        producer: product.cooperativeId?.userId ? {
          id: product.cooperativeId.userId._id.toString(),
          email: product.cooperativeId.userId.email,
          phone: product.cooperativeId.userId.phone,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'GET_PRODUCT_ERROR',
    });
  }
});

/**
 * POST /api/products
 * Create new product
 */
router.post('/', verifyTokenMiddleware, roleCheck(['PRODUCER']), async (req, res) => {
  try {
    const { name, description, price, unit, stock_quantity, image_url, image_urls } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!name || !price || !unit) {
      return res.status(400).json({
        success: false,
        message: 'name, price, and unit are required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
        error: 'INVALID_PRICE',
      });
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity cannot be negative',
        error: 'INVALID_STOCK_QUANTITY',
      });
    }

    // Verify user has cooperative
    const cooperativeId = await getUserCooperative(userId);

    if (!cooperativeId) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a cooperative. Please create a cooperative first.',
        error: 'NO_COOPERATIVE',
      });
    }

    // Handle images: support both image_urls array and image_url (for backward compatibility)
    let imageUrls = [];
    if (image_urls && Array.isArray(image_urls)) {
      imageUrls = image_urls.filter(url => url && typeof url === 'string');
    } else if (image_url) {
      imageUrls = [image_url];
    }

    // Create product
    const product = await Product.create({
      cooperativeId,
      name,
      description: description || null,
      price,
      unit,
      stockQuantity: stock_quantity || 0,
      imageUrl: imageUrls[0] || null, // Keep for backward compatibility
      imageUrls: imageUrls, // Array of images (Amazon-style)
    });

    // Format response with imageUrls
    const responseImageUrls = product.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : (product.imageUrl ? [product.imageUrl] : []);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          unit: product.unit,
          stockQuantity: product.stockQuantity,
          imageUrl: responseImageUrls[0] || null, // First image for backward compatibility
          imageUrls: responseImageUrls, // Array of all images
          createdAt: product.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'CREATE_PRODUCT_ERROR',
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/:id', verifyTokenMiddleware, roleCheck(['PRODUCER']), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, unit, stock_quantity, image_url, image_urls } = req.body;
    const userId = req.user.userId;

    // Verify product belongs to user's cooperative
    await verifyProductOwnership(productId, userId);

    // Build update object
    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0',
          error: 'INVALID_PRICE',
        });
      }
      updates.price = price;
    }

    if (unit !== undefined) {
      updates.unit = unit;
    }

    if (stock_quantity !== undefined) {
      if (stock_quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock quantity cannot be negative',
          error: 'INVALID_STOCK_QUANTITY',
        });
      }
      updates.stockQuantity = stock_quantity;
    }

    // Handle images: support both image_urls array and image_url (for backward compatibility)
    if (image_urls !== undefined) {
      if (Array.isArray(image_urls)) {
        const filteredUrls = image_urls.filter(url => url && typeof url === 'string');
        updates.imageUrls = filteredUrls;
        updates.imageUrl = filteredUrls[0] || null; // Keep first image for backward compatibility
      } else {
        updates.imageUrls = [];
        updates.imageUrl = null;
      }
    } else if (image_url !== undefined) {
      // If only image_url is provided, convert to array
      updates.imageUrls = image_url ? [image_url] : [];
      updates.imageUrl = image_url || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: 'NO_UPDATES',
      });
    }

    // Update product
    const product = await Product.findOneAndUpdate(
      { _id: productId, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    // Format response with imageUrls
    const responseImageUrls = product.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : (product.imageUrl ? [product.imageUrl] : []);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          unit: product.unit,
          stockQuantity: product.stockQuantity,
          imageUrl: responseImageUrls[0] || null, // First image for backward compatibility
          imageUrls: responseImageUrls, // Array of all images
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update product error:', error);

    if (error.message.includes('not found') || error.message.includes('does not belong')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    if (error.message.includes('does not have a cooperative')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'NO_COOPERATIVE',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'UPDATE_PRODUCT_ERROR',
    });
  }
});

/**
 * DELETE /api/products/:id
 * Soft delete product
 */
router.delete('/:id', verifyTokenMiddleware, roleCheck(['PRODUCER']), async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.userId;

    // Verify product belongs to user's cooperative
    await verifyProductOwnership(productId, userId);

    // Soft delete product
    const product = await Product.findOneAndUpdate(
      { _id: productId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);

    if (error.message.includes('not found') || error.message.includes('does not belong')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    if (error.message.includes('does not have a cooperative')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'NO_COOPERATIVE',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: 'DELETE_PRODUCT_ERROR',
    });
  }
});

export default router;
