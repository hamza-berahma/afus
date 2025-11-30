/**
 * Response formatting utilities
 */

/**
 * Format success response
 */
export function formatSuccessResponse(data) {
  return {
    result: data
  };
}

/**
 * Format error response
 */
export function formatErrorResponse(code, message, details = null) {
  const response = {
    error: {
      code,
      message
    }
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}

/**
 * Format transaction response
 */
export function formatTransactionResponse(transaction) {
  return {
    amount: transaction.amount,
    Fees: transaction.fees || "0.00",
    beneficiaryFirstName: transaction.beneficiaryFirstName || "",
    beneficiaryLastName: transaction.beneficiaryLastName || "",
    clientNote: transaction.clientNote || "",
    currency: transaction.currency || "MAD",
    date: transaction.date || new Date().toISOString(),
    referenceId: transaction.referenceId,
    status: transaction.status || "000",
    type: transaction.type,
    totalFrai: transaction.totalFees || "0.00",
    isCanceled: transaction.isCanceled || false
  };
}

/**
 * Format balance response
 */
export function formatBalanceResponse(balance) {
  return {
    balance: [
      {
        value: parseFloat(balance).toFixed(2)
      }
    ]
  };
}

