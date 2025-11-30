/**
 * Cooperative Score Service
 * 
 * Calculates a trust/quality score (0-5.0) for cooperatives based on:
 * - Transaction success rate
 * - Total transactions volume
 * - Average order completion time
 * - Customer satisfaction (based on successful transactions)
 * - Account age and stability
 */

import Transaction from '../db/models/Transaction.js';
import Product from '../db/models/Product.js';
import Cooperative from '../db/models/Cooperative.js';

export class CooperativeScoreService {
  constructor() {
    this.BASE_SCORE = 3.0; // Base rating of 3.0
    this.MAX_SCORE = 5.0;
    this.MIN_SCORE = 0.0;
  }

  /**
   * Calculate cooperative score
   * @param {string} cooperativeId - MongoDB ObjectId
   * @returns {Promise<Object>} Score data with rating, customerCount, and breakdown
   */
  async calculateScore(cooperativeId) {
    try {
      // Get all products for this cooperative
      const products = await Product.find({ 
        cooperativeId,
        deletedAt: null 
      }).select('_id').lean();

      const productIds = products.map(p => p._id);

      if (productIds.length === 0) {
        return {
          rating: this.BASE_SCORE,
          customerCount: 0,
          totalTransactions: 0,
          successfulTransactions: 0,
          breakdown: {
            baseScore: this.BASE_SCORE,
            successRatePoints: 0,
            volumePoints: 0,
            stabilityPoints: 0,
          },
        };
      }

      // Get all transactions for these products
      const transactions = await Transaction.find({
        productId: { $in: productIds },
      }).lean();

      // Get cooperative for account age
      const cooperative = await Cooperative.findById(cooperativeId).select('createdAt').lean();
      const accountAge = cooperative 
        ? Math.floor((Date.now() - new Date(cooperative.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate breakdown
      const breakdown = this.calculateBreakdown(transactions, accountAge);

      // Calculate final rating
      const rating = this.calculateRating(breakdown);

      // Get unique customer count
      const uniqueCustomers = new Set(
        transactions
          .filter(tx => tx.buyerId)
          .map(tx => tx.buyerId.toString())
      );

      return {
        rating: Math.max(this.MIN_SCORE, Math.min(this.MAX_SCORE, rating)),
        customerCount: uniqueCustomers.size,
        totalTransactions: transactions.length,
        successfulTransactions: transactions.filter(tx => tx.status === 'SETTLED').length,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating cooperative score:', error);
      // Return base score on error
      return {
        rating: this.BASE_SCORE,
        customerCount: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        breakdown: {
          baseScore: this.BASE_SCORE,
          successRatePoints: 0,
          volumePoints: 0,
          stabilityPoints: 0,
        },
      };
    }
  }

  /**
   * Calculate score breakdown components
   * @param {Array} transactions
   * @param {number} accountAge - Days since account creation
   * @returns {Object}
   */
  calculateBreakdown(transactions, accountAge) {
    const baseScore = this.BASE_SCORE;

    if (transactions.length === 0) {
      return {
        baseScore,
        successRatePoints: 0,
        volumePoints: 0,
        stabilityPoints: 0,
      };
    }

    // Success Rate Factor: +0 to +1.5 points based on success rate
    // 100% success = +1.5, 0% success = 0
    const successfulTransactions = transactions.filter(
      tx => tx.status === 'SETTLED'
    ).length;
    const successRate = successfulTransactions / transactions.length;
    const successRatePoints = successRate * 1.5; // Max 1.5 points

    // Volume Factor: +0 to +0.3 points based on transaction count
    // More transactions = more trust (capped at 50+ transactions)
    const volumePoints = Math.min(0.3, (transactions.length / 50) * 0.3);

    // Stability Factor: +0 to +0.2 points based on account age
    // Older accounts = more trust (capped at 365 days = 1 year)
    const stabilityPoints = Math.min(0.2, (accountAge / 365) * 0.2);

    return {
      baseScore,
      successRatePoints,
      volumePoints,
      stabilityPoints,
    };
  }

  /**
   * Calculate final rating from breakdown
   * @param {Object} breakdown
   * @returns {number}
   */
  calculateRating(breakdown) {
    const {
      baseScore,
      successRatePoints,
      volumePoints,
      stabilityPoints,
    } = breakdown;

    return baseScore + successRatePoints + volumePoints + stabilityPoints;
  }

  /**
   * Format rating for display
   * @param {number} rating
   * @returns {string}
   */
  formatRating(rating) {
    return rating.toFixed(1);
  }

  /**
   * Get rating badge color
   * @param {number} rating
   * @returns {string}
   */
  getRatingColor(rating) {
    if (rating >= 4.5) return 'success'; // Green
    if (rating >= 4.0) return 'primary'; // Blue
    if (rating >= 3.5) return 'warning'; // Yellow
    return 'gray'; // Gray
  }
}

export default new CooperativeScoreService();

