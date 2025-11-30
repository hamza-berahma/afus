import express from 'express';
import Transaction from '../db/models/Transaction.js';
import Product from '../db/models/Product.js';
import User from '../db/models/User.js';
import Cooperative from '../db/models/Cooperative.js';
import { verifyTokenMiddleware, roleCheck } from '../middleware/auth.js';
import bankingService from '../services/banking/index.js';

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for current user
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get user's wallet balance
    const user = await User.findById(userId).select('walletId');
    let walletBalance = 0;
    if (user?.walletId) {
      try {
        const balanceData = await bankingService.getBalance(user.walletId);
        walletBalance = balanceData.balance || 0;
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    }

    if (userRole === 'BUYER') {
      // Buyer dashboard stats
      const buyerStats = await Transaction.aggregate([
        { $match: { buyerId: userId } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            pendingOrders: {
              $sum: { $cond: [{ $in: ['$status', ['ESCROWED', 'SHIPPED', 'DELIVERED']] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'SETTLED'] }, 1, 0] }
            },
          },
        },
      ]);

      const stats = buyerStats[0] || {
        totalSpent: 0,
        totalTransactions: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };

      // Get recent transactions
      const recentTransactions = await Transaction.find({ buyerId: userId })
        .populate('sellerId', 'email')
        .populate('productId', 'name price')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      res.json({
        success: true,
        data: {
          walletBalance,
          totalSpent: stats.totalSpent,
          totalTransactions: stats.totalTransactions,
          pendingOrders: stats.pendingOrders,
          completedOrders: stats.completedOrders,
          recentTransactions: recentTransactions.map((tx) => ({
            id: tx._id.toString(),
            product: tx.productId?.name,
            amount: tx.totalAmount,
            status: tx.status,
            createdAt: tx.createdAt,
          })),
        },
      });
    } else if (userRole === 'PRODUCER') {
      // Producer dashboard stats
      const cooperative = await Cooperative.findOne({ userId }).lean();
      
      if (!cooperative) {
        return res.json({
          success: true,
          data: {
            walletBalance,
            hasCooperative: false,
            message: 'No cooperative registered',
          },
        });
      }

      // Get products
      const products = await Product.find({ cooperativeId: cooperative._id, deletedAt: null });
      const productIds = products.map((p) => p._id);

      // Get sales stats
      const salesStats = await Transaction.aggregate([
        { $match: { sellerId: userId, productId: { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            pendingOrders: {
              $sum: { $cond: [{ $in: ['$status', ['ESCROWED', 'SHIPPED', 'DELIVERED']] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'SETTLED'] }, 1, 0] }
            },
            totalEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'SETTLED'] }, '$amount', 0] }
            },
          },
        },
      ]);

      const stats = salesStats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalEarnings: 0,
      };

      // Get recent orders
      const recentOrders = await Transaction.find({ sellerId: userId, productId: { $in: productIds } })
        .populate('buyerId', 'email')
        .populate('productId', 'name price')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Calculate low stock products
      const lowStockProducts = products.filter((p) => p.stockQuantity < 10).length;

      res.json({
        success: true,
        data: {
          walletBalance,
          hasCooperative: true,
          cooperative: {
            id: cooperative._id.toString(),
            name: cooperative.name,
            region: cooperative.region,
          },
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.stockQuantity > 0).length,
          lowStockProducts,
          totalRevenue: stats.totalRevenue,
          totalEarnings: stats.totalEarnings,
          totalTransactions: stats.totalTransactions,
          pendingOrders: stats.pendingOrders,
          completedOrders: stats.completedOrders,
          recentOrders: recentOrders.map((tx) => ({
            id: tx._id.toString(),
            product: tx.productId?.name,
            buyer: tx.buyerId?.email,
            amount: tx.totalAmount,
            status: tx.status,
            createdAt: tx.createdAt,
          })),
        },
      });
    } else if (userRole === 'ADMIN') {
      // Admin dashboard stats
      const [
        totalUsers,
        totalProducers,
        totalBuyers,
        totalProducts,
        totalTransactions,
        totalRevenue,
        recentTransactions,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'PRODUCER' }),
        User.countDocuments({ role: 'BUYER' }),
        Product.countDocuments({ deletedAt: null }),
        Transaction.countDocuments(),
        Transaction.aggregate([
          { $match: { status: 'SETTLED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.find()
          .populate('buyerId', 'email')
          .populate('sellerId', 'email')
          .populate('productId', 'name')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        User.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('email role createdAt')
          .lean(),
      ]);

      const revenue = totalRevenue[0]?.total || 0;

      // Get transaction status breakdown
      const statusBreakdown = await Transaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalProducers,
          totalBuyers,
          totalProducts,
          totalTransactions,
          totalRevenue: revenue,
          statusBreakdown: statusBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentTransactions: recentTransactions.map((tx) => ({
            id: tx._id.toString(),
            product: tx.productId?.name,
            buyer: tx.buyerId?.email,
            seller: tx.sellerId?.email,
            amount: tx.totalAmount,
            status: tx.status,
            createdAt: tx.createdAt,
          })),
          recentUsers: recentUsers.map((u) => ({
            id: u._id.toString(),
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          })),
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          walletBalance,
          message: 'No specific dashboard for this role',
        },
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'DASHBOARD_ERROR',
    });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get analytics data (for producers and admins)
 */
router.get('/analytics', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { period = '30' } = req.query; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    if (userRole === 'PRODUCER') {
      const cooperative = await Cooperative.findOne({ userId }).lean();
      if (!cooperative) {
        return res.json({
          success: true,
          data: {
            message: 'No cooperative registered',
          },
        });
      }

      const products = await Product.find({ cooperativeId: cooperative._id, deletedAt: null });
      const productIds = products.map((p) => p._id);

      // Get sales over time
      const salesOverTime = await Transaction.aggregate([
        {
          $match: {
            sellerId: userId,
            productId: { $in: productIds },
            createdAt: { $gte: daysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get top products
      const topProducts = await Transaction.aggregate([
        {
          $match: {
            sellerId: userId,
            productId: { $in: productIds },
            status: 'SETTLED',
          },
        },
        {
          $group: {
            _id: '$productId',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]);

      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await Product.findById(item._id).lean();
          return {
            productId: item._id.toString(),
            productName: product?.name || 'Unknown',
            salesCount: item.count,
            revenue: item.revenue,
          };
        })
      );

      res.json({
        success: true,
        data: {
          salesOverTime,
          topProducts: topProductsWithDetails,
        },
      });
    } else if (userRole === 'ADMIN') {
      // Admin analytics
      const [
        usersOverTime,
        transactionsOverTime,
        revenueOverTime,
      ] = await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: daysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: daysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
              revenue: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              status: 'SETTLED',
              createdAt: { $gte: daysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              revenue: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          usersOverTime,
          transactionsOverTime,
          revenueOverTime,
        },
      });
    }
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'ANALYTICS_ERROR',
    });
  }
});

export default router;

