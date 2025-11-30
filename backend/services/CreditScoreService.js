/**
 * Credit Score Service (Ma3qoul Score)
 * 
 * Calculates a trust score (300-850) based on:
 * - Transaction volume
 * - Escrow reliability
 * - Account stability
 * - Dispute history
 */

import Transaction from '../db/models/Transaction.js';
import User from '../db/models/User.js';

/**
 * @typedef {Object} CreditScoreResult
 * @property {number} score
 * @property {'Building Trust' | 'Silver Producer' | 'Gold Partner'} tier
 * @property {number} maxLoanAmount
 * @property {string} nextMilestone
 * @property {Object} breakdown
 * @property {number} breakdown.baseScore
 * @property {number} breakdown.volumePoints
 * @property {number} breakdown.reliabilityPoints
 * @property {number} breakdown.stabilityPoints
 * @property {number} breakdown.penaltyPoints
 */

export class CreditScoreService {
  constructor() {
    this.BASE_SCORE = 300;
    this.MAX_VOLUME_POINTS = 200;
    this.MAX_RELIABILITY_POINTS = 250;
    this.MAX_STABILITY_POINTS = 100;
    this.POINTS_PER_100_MAD = 1;
    this.POINTS_PER_SUCCESSFUL_ESCROW = 50;
    this.POINTS_PER_DAY_ACTIVE = 2;
    this.PENALTY_PER_DISPUTE = 100;
  }

  /**
   * Calculate credit score for a user
   * @param {string | any} userId - MongoDB ObjectId or string
   * @returns {Promise<CreditScoreResult>} CreditScoreResult with score, tier, and loan eligibility
   */
  async calculateScore(userId) {
    // Get user to check account creation date
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all transactions where user is the seller (producer)
    const transactions = await Transaction.find({
      sellerId: userId,
    }).lean();

    // Calculate breakdown
    const breakdown = this.calculateBreakdown(transactions, user.createdAt);

    // Calculate total score
    const score = Math.max(300, Math.min(850, 
      breakdown.baseScore +
      breakdown.volumePoints +
      breakdown.reliabilityPoints +
      breakdown.stabilityPoints -
      breakdown.penaltyPoints
    ));

    // Determine tier and loan eligibility
    const tier = this.getTier(score);
    const maxLoanAmount = this.getMaxLoanAmount(tier);
    const nextMilestone = this.getNextMilestone(score, breakdown);

    return {
      score: Math.round(score),
      tier,
      maxLoanAmount,
      nextMilestone,
      breakdown,
    };
  }

  /**
   * Calculate score breakdown components
   * @param {any[]} transactions
   * @param {Date} accountCreatedAt
   * @returns {Object}
   */
  calculateBreakdown(transactions, accountCreatedAt) {
    const baseScore = this.BASE_SCORE;

    // Volume Factor: +1 point per 100 MAD transacted (Max 200 pts)
    const totalVolume = transactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
    const volumePoints = Math.min(
      this.MAX_VOLUME_POINTS,
      Math.floor(totalVolume / 100) * this.POINTS_PER_100_MAD
    );

    // Reliability Factor: +50 points per successful Escrow release (Max 250 pts)
    // SETTLED status means escrow was successfully released
    const successfulEscrows = transactions.filter(
      tx => tx.status === 'SETTLED'
    ).length;
    const reliabilityPoints = Math.min(
      this.MAX_RELIABILITY_POINTS,
      successfulEscrows * this.POINTS_PER_SUCCESSFUL_ESCROW
    );

    // Stability Factor: +2 points per day active (Max 100 pts)
    const daysActive = Math.floor(
      (Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const stabilityPoints = Math.min(
      this.MAX_STABILITY_POINTS,
      daysActive * this.POINTS_PER_DAY_ACTIVE
    );

    // Penalty Factor: -100 points per disputed transaction
    // For now, we'll consider FAILED transactions as disputes
    // In production, you might want a separate 'DISPUTED' status
    const disputedTransactions = transactions.filter(
      tx => tx.status === 'FAILED'
    ).length;
    const penaltyPoints = disputedTransactions * this.PENALTY_PER_DISPUTE;

    return {
      baseScore,
      volumePoints,
      reliabilityPoints,
      stabilityPoints,
      penaltyPoints,
    };
  }

  /**
   * Get tier based on score
   * @param {number} score
   * @returns {'Building Trust' | 'Silver Producer' | 'Gold Partner'}
   */
  getTier(score) {
    if (score >= 701) {
      return 'Gold Partner';
    } else if (score >= 551) {
      return 'Silver Producer';
    } else {
      return 'Building Trust';
    }
  }

  /**
   * Get maximum loan amount based on tier
   * @param {'Building Trust' | 'Silver Producer' | 'Gold Partner'} tier
   * @returns {number}
   */
  getMaxLoanAmount(tier) {
    switch (tier) {
      case 'Gold Partner':
        return 20000; // 20,000 MAD micro-loan
      case 'Silver Producer':
        return 5000;  // 5,000 MAD overdraft
      case 'Building Trust':
        return 0;     // No loans
      default:
        return 0;
    }
  }

  /**
   * Get next milestone message
   * @param {number} score
   * @param {Object} breakdown
   * @returns {string}
   */
  getNextMilestone(score, breakdown) {
    if (score >= 850) {
      return 'You\'ve reached the maximum score! 🏆';
    }

    if (score < 551) {
      // Building Trust tier
      const pointsNeeded = 551 - score;
      const ordersNeeded = Math.ceil(pointsNeeded / this.POINTS_PER_SUCCESSFUL_ESCROW);
      return `Complete ${ordersNeeded} more successful order${ordersNeeded !== 1 ? 's' : ''} to reach Silver Tier (551+)`;
    } else if (score < 701) {
      // Silver Producer tier
      const pointsNeeded = 701 - score;
      const ordersNeeded = Math.ceil(pointsNeeded / this.POINTS_PER_SUCCESSFUL_ESCROW);
      return `Complete ${ordersNeeded} more successful order${ordersNeeded !== 1 ? 's' : ''} to unlock Gold Tier (701+)`;
    } else {
      // Gold Partner tier
      const pointsNeeded = 850 - score;
      if (breakdown.volumePoints < this.MAX_VOLUME_POINTS) {
        const madNeeded = ((this.MAX_VOLUME_POINTS - breakdown.volumePoints) * 100);
        return `Transact ${madNeeded.toFixed(0)} more MAD to maximize your score`;
      } else if (breakdown.reliabilityPoints < this.MAX_RELIABILITY_POINTS) {
        const ordersNeeded = Math.ceil((this.MAX_RELIABILITY_POINTS - breakdown.reliabilityPoints) / this.POINTS_PER_SUCCESSFUL_ESCROW);
        return `Complete ${ordersNeeded} more successful order${ordersNeeded !== 1 ? 's' : ''} to maximize your score`;
      } else {
        return 'Continue maintaining your excellent track record!';
      }
    }
  }
}

// Export singleton instance
export default new CreditScoreService();

