/**
 * Wallet API Routes
 * 
 * Complete implementation of CIH Wallet Management API endpoints
 * Supports both mock and live API providers
 */

import express from 'express';
import { verifyTokenMiddleware } from '../middleware/auth.js';
import walletApi, {
  WalletAPIError,
  ValidationError,
  InvalidOTPError,
  InsufficientBalanceError,
  ContractNotFoundError,
  resetWalletService,
  getWalletService,
} from '../services/wallet-api/index.js';

const router = express.Router();

// Error handler middleware
const handleWalletError = (error, res) => {
  console.error('Wallet API Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error instanceof InvalidOTPError) {
    return res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof InsufficientBalanceError) {
    return res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof ContractNotFoundError) {
    return res.status(404).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof WalletAPIError) {
    return res.status(error.statusCode || 500).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

/**
 * 1. Wallet Pre-Creation
 * POST /api/wallet-api/wallet?state=precreate
 */
router.post('/wallet', async (req, res) => {
  try {
    const { state } = req.query;

    if (state === 'precreate') {
      const result = await walletApi.preCreateWallet(req.body);
      return res.status(201).json(result);
    }

    if (state === 'activate') {
      const result = await walletApi.activateWallet(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STATE',
        message: 'State must be "precreate" or "activate"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 2. Customer Information Consultation
 * POST /api/wallet-api/clientinfo
 */
router.post('/clientinfo', async (req, res) => {
  try {
    const result = await walletApi.getCustomerInfo(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 3. Transaction History
 * GET /api/wallet-api/operations?contractid={contractId}
 */
router.get('/operations', async (req, res) => {
  try {
    const { contractid, limit = 10 } = req.query;
    const result = await walletApi.getTransactionHistory(contractid, parseInt(limit));
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 4. Balance Consultation
 * GET /api/wallet-api/balance?contractid={contractId}
 */
router.get('/balance', async (req, res) => {
  try {
    const { contractid } = req.query;
    const result = await walletApi.getBalance(contractid);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 5. Cash IN - Simulation
 * POST /api/wallet-api/cash/in?step=simulation
 */
router.post('/cash/in', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.cashInSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.cashInConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 6. Cash OUT - Simulation, OTP, Confirmation
 * POST /api/wallet-api/cash/out?step=simulation
 * POST /api/wallet-api/cash/out/otp
 * POST /api/wallet-api/cash/out?step=confirmation
 */
router.post('/cash/out', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.cashOutSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.cashOutConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

router.post('/cash/out/otp', async (req, res) => {
  try {
    const result = await walletApi.cashOutOTP(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 7. Wallet to Wallet Transfer
 * POST /api/wallet-api/transfer/wallet?step=simulation
 * POST /api/wallet-api/transfer/wallet/otp
 * POST /api/wallet-api/transfer/wallet?step=confirmation
 */
router.post('/transfer/wallet', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.walletTransferSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.walletTransferConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

router.post('/transfer/wallet/otp', async (req, res) => {
  try {
    const result = await walletApi.walletTransferOTP(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 8. Bank Transfer
 * POST /api/wallet-api/transfer/virement?step=simulation
 * POST /api/wallet-api/transfer/virement/otp
 * POST /api/wallet-api/transfer/virement?step=confirmation
 */
router.post('/transfer/virement', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.bankTransferSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.bankTransferConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

router.post('/transfer/virement/otp', async (req, res) => {
  try {
    const result = await walletApi.bankTransferOTP(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 9. ATM Withdrawal
 * POST /api/wallet-api/cash/gab/out?step=simulation
 * POST /api/wallet-api/cash/gab/otp
 * POST /api/wallet-api/cash/gab/out?step=confirmation
 */
router.post('/cash/gab/out', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.atmWithdrawalSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.atmWithdrawalConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

router.post('/cash/gab/otp', async (req, res) => {
  try {
    const result = await walletApi.atmWithdrawalOTP(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 10. Wallet to Merchant Payment
 * POST /api/wallet-api/Transfer/WalletToMerchant?step=simulation
 * POST /api/wallet-api/walletToMerchant/cash/out/otp
 * POST /api/wallet-api/Transfer/WalletToMerchant?step=confirmation
 */
router.post('/Transfer/WalletToMerchant', async (req, res) => {
  try {
    const { step } = req.query;

    if (step === 'simulation') {
      const result = await walletApi.walletToMerchantSimulation(req.body);
      return res.json(result);
    }

    if (step === 'confirmation') {
      const result = await walletApi.walletToMerchantConfirmation(req.body);
      return res.json(result);
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_STEP',
        message: 'Step must be "simulation" or "confirmation"',
      },
    });
  } catch (error) {
    return handleWalletError(error, res);
  }
});

router.post('/walletToMerchant/cash/out/otp', async (req, res) => {
  try {
    const result = await walletApi.walletToMerchantOTP(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 11. Merchant Pre-Creation
 * POST /api/wallet-api/merchants
 */
router.post('/merchants', async (req, res) => {
  try {
    const result = await walletApi.merchantPreCreate(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 12. Merchant Activation
 * POST /api/wallet-api/merchant/activate
 */
router.post('/merchant/activate', async (req, res) => {
  try {
    const result = await walletApi.merchantActivate(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

/**
 * 13. Dynamic QR Code Generation
 * POST /api/wallet-api/pro/qrcode/dynamic
 */
router.post('/pro/qrcode/dynamic', async (req, res) => {
  try {
    const result = await walletApi.generateDynamicQRCode(req.body);
    return res.json(result);
  } catch (error) {
    return handleWalletError(error, res);
  }
});

export default router;

