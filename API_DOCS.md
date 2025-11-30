# Afus ⴰⴼⵓⵙ API Documentation

Complete API reference for the Afus platform, including authentication, wallet management, transactions, products, and cooperatives.

## Table of Contents

1. [Base URL & Authentication](#base-url--authentication)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Wallet Endpoints](#wallet-endpoints)
4. [Wallet API Endpoints](#wallet-api-endpoints)
5. [Transaction Endpoints](#transaction-endpoints)
6. [Product Endpoints](#product-endpoints)
7. [Cooperative Endpoints](#cooperative-endpoints)
8. [Dashboard Endpoints](#dashboard-endpoints)
9. [Error Handling](#error-handling)

---

## Base URL & Authentication

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.afus.com/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Authentication Endpoints

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+212612345678",
  "password": "SecurePass123",
  "role": "BUYER"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "phone": "+212612345678",
      "role": "BUYER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Error Codes:**
- `MISSING_FIELDS`: Required fields missing
- `INVALID_EMAIL`: Invalid email format
- `INVALID_PHONE`: Invalid phone format
- `INVALID_PASSWORD`: Password doesn't meet requirements
- `INVALID_ROLE`: Invalid role (must be BUYER, PRODUCER, or ADMIN)
- `EMAIL_EXISTS`: Email already registered
- `PHONE_EXISTS`: Phone already registered

---

### POST `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",  // OR "phone": "+212612345678"
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "phone": "+212612345678",
      "role": "BUYER",
      "walletId": "wallet_id_or_null",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Error Codes:**
- `MISSING_PASSWORD`: Password required
- `MISSING_CREDENTIALS`: Email or phone required
- `INVALID_EMAIL`: Invalid email format
- `INVALID_PHONE`: Invalid phone format
- `INVALID_CREDENTIALS`: Wrong email/phone or password

---

### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

---

### GET `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "phone": "+212612345678",
      "role": "BUYER",
      "walletId": "wallet_id_or_null",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Wallet Endpoints

### GET `/api/wallet/balance`

Get user's wallet balance.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 5000.00,
    "currency": "MAD",
    "walletId": "wallet_id"
  }
}
```

---

### GET `/api/wallet/transactions`

Get user's transaction history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (number, default: 20, max: 100): Results per page
- `offset` (number, default: 0): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_id",
        "amount": 700.00,
        "fee": 14.00,
        "totalAmount": 714.00,
        "status": "SETTLED",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "buyer": { "id": "buyer_id", "email": "buyer@example.com" },
        "seller": { "id": "seller_id", "email": "seller@example.com" },
        "product": { "id": "product_id", "name": "Premium Argan Oil" },
        "userRole": "buyer"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 50,
      "hasMore": true
    }
  }
}
```

---

### POST `/api/wallet/activate`

Activate user's wallet with CIH API.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Wallet activated successfully",
  "data": {
    "walletId": "wallet_id",
    "contractId": "contract_id",
    "status": "active"
  }
}
```

---

## Wallet API Endpoints

The Wallet API provides comprehensive wallet management operations following the CIH Bank API specification.

### POST `/api/wallet-api/pre-create-wallet`

Pre-create wallet (step 1 of wallet creation).

**Request Body:**
```json
{
  "phoneNumber": "212700446631",
  "clientFirstName": "John",
  "clientLastName": "Doe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "pre_creation_token",
    "expiresIn": 300
  }
}
```

---

### POST `/api/wallet-api/create-wallet`

Create wallet (step 2 of wallet creation).

**Request Body:**
```json
{
  "token": "pre_creation_token",
  "otp": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "walletId": "wallet_id",
    "contractId": "contract_id",
    "status": "active"
  }
}
```

---

### GET `/api/wallet-api/balance`

Get wallet balance.

**Query Parameters:**
- `phoneNumber` (string, required): Phone number associated with wallet

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 5000.00,
    "currency": "MAD",
    "walletId": "wallet_id"
  }
}
```

---

### GET `/api/wallet-api/history`

Get wallet transaction history.

**Query Parameters:**
- `phoneNumber` (string, required): Phone number associated with wallet
- `limit` (number, optional): Number of transactions to return
- `offset` (number, optional): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_id",
        "type": "DEBIT",
        "amount": 100.00,
        "description": "Payment to merchant",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 50
    }
  }
}
```

---

### POST `/api/wallet-api/cash-in`

Deposit money into wallet.

**Request Body:**
```json
{
  "phoneNumber": "212700446631",
  "amount": 500.00,
  "method": "branch"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_id",
    "reference": "ref_123",
    "newBalance": 5500.00
  }
}
```

---

### POST `/api/wallet-api/cash-out`

Withdraw money from wallet.

**Request Body:**
```json
{
  "phoneNumber": "212700446631",
  "amount": 200.00,
  "method": "atm"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_id",
    "reference": "ref_123",
    "newBalance": 4800.00
  }
}
```

---

### POST `/api/wallet-api/transfer/wallet`

Transfer money between wallets (simulation or confirmation).

**Query Parameters:**
- `step` (string, required): Either "simulation" or "confirmation"

**Request Body (Simulation):**
```json
{
  "amount": 100.00,
  "sourcePhoneNumber": "212700446631",
  "destinationPhoneNumber": "212700446632"
}
```

**Response (200) - Simulation:**
```json
{
  "success": true,
  "data": {
    "token": "transfer_token",
    "totalAmount": 102.00,
    "fee": 2.00
  }
}
```

**Request Body (Confirmation):**
```json
{
  "amount": 100.00,
  "sourcePhoneNumber": "212700446631",
  "destinationPhoneNumber": "212700446632",
  "token": "transfer_token",
  "otp": "123456"
}
```

**Response (200) - Confirmation:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_id",
    "reference": "ref_123",
    "sourceBalance": 4900.00,
    "destinationBalance": 5100.00
  }
}
```

---

### POST `/api/wallet-api/transfer/wallet/otp`

Request OTP for wallet transfer.

**Request Body:**
```json
{
  "token": "transfer_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "otpSent": true,
    "expiresIn": 300
  }
}
```

---

## Transaction Endpoints

### POST `/api/transactions/simulate`

Simulate transaction to calculate fees (BUYER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "productCost": 700.00,
    "fee": 14.00,
    "totalCost": 714.00,
    "breakdown": {
      "productCost": 700.00,
      "transactionFee": 14.00,
      "total": 714.00
    }
  }
}
```

---

### POST `/api/transactions/create`

Create escrow transaction (BUYER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "simulatedFee": 14.00
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created and funds escrowed",
  "data": {
    "transactionId": "transaction_id",
    "status": "ESCROWED",
    "escrowTransactionId": "cih_tx_id",
    "amount": 700.00,
    "fee": 14.00,
    "totalAmount": 714.00,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/transactions/:id/ship`

Mark transaction as shipped and generate QR code (PRODUCER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Transaction ID

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction marked as shipped",
  "data": {
    "transactionId": "transaction_id",
    "status": "SHIPPED",
    "qrCode": {
      "payload": {
        "transaction_id": "transaction_id",
        "amount": 714.00,
        "timestamp": 1704067200000
      },
      "signature": "hmac_signature",
      "encoded": "base64_encoded_qr_data"
    }
  }
}
```

---

### POST `/api/transactions/:id/confirm-delivery`

Confirm delivery and release escrow (BUYER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Transaction ID

**Request Body:**
```json
{
  "qrSignature": "hmac_signature"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Delivery confirmed and payment released",
  "data": {
    "transactionId": "transaction_id",
    "status": "SETTLED",
    "settledAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/api/transactions/:id`

Get transaction details with logs.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Transaction ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "transaction_id",
      "amount": 700.00,
      "fee": 14.00,
      "totalAmount": 714.00,
      "status": "SHIPPED",
      "escrowTransactionId": "cih_tx_id",
      "qrSignature": "hmac_signature",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z",
      "settledAt": null
    },
    "buyer": {
      "id": "buyer_id",
      "email": "buyer@example.com",
      "phone": "+212612345678"
    },
    "seller": {
      "id": "seller_id",
      "email": "seller@example.com",
      "phone": "+212612345679"
    },
    "product": {
      "id": "product_id",
      "name": "Premium Argan Oil",
      "description": "Cold-pressed organic argan oil",
      "price": 350.00,
      "unit": "liter"
    },
    "logs": [
      {
        "id": "log_id",
        "status": "INITIATED",
        "message": "Transaction created",
        "apiResponse": {},
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### POST `/api/transactions/:id/dispute`

Create dispute for transaction.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Transaction ID

**Request Body:**
```json
{
  "reason": "Product damaged",
  "description": "Product arrived with damaged packaging"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dispute created and admin notified",
  "data": {
    "transactionId": "transaction_id",
    "status": "FAILED",
    "dispute": {
      "reason": "Product damaged",
      "description": "Product arrived with damaged packaging",
      "raisedBy": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Product Endpoints

### GET `/api/products`

Get paginated list of products with filters.

**Query Parameters:**
- `region` (string, optional): Filter by cooperative region
- `cooperativeId` (string, optional): Filter by cooperative ID
- `search` (string, optional): Search in name/description
- `limit` (number, default: 20, max: 100): Results per page
- `offset` (number, default: 0): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Premium Argan Oil",
        "description": "Cold-pressed organic argan oil",
        "price": 350.00,
        "unit": "liter",
        "stockQuantity": 45.5,
        "imageUrl": "https://example.com/image.jpg",
        "imageUrls": ["url1", "url2"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "cooperative": {
          "id": "coop_id",
          "name": "Essaouira Argan Cooperative",
          "region": "Essaouira"
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 50,
      "hasMore": true
    }
  }
}
```

---

### GET `/api/products/:id`

Get single product details.

**Path Parameters:**
- `id` (string, required): Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product_id",
      "name": "Premium Argan Oil",
      "description": "Cold-pressed organic argan oil",
      "price": 350.00,
      "unit": "liter",
      "stockQuantity": 45.5,
      "imageUrl": "https://example.com/image.jpg",
      "imageUrls": ["url1", "url2"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "cooperative": {
      "id": "coop_id",
      "name": "Essaouira Argan Cooperative",
      "region": "Essaouira",
      "registrationNumber": "REG-ES-2024-001"
    },
    "producer": {
      "id": "user_id",
      "email": "producer@example.com",
      "phone": "+212612345679"
    }
  }
}
```

---

### POST `/api/products`

Create a new product (PRODUCER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Premium Argan Oil",
  "description": "Cold-pressed organic argan oil",
  "price": 350.00,
  "unit": "liter",
  "stock_quantity": 45.5,
  "image_url": "https://example.com/image.jpg",
  "image_urls": ["url1", "url2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "product_id",
      "name": "Premium Argan Oil",
      "description": "Cold-pressed organic argan oil",
      "price": 350.00,
      "unit": "liter",
      "stockQuantity": 45.5,
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### PUT `/api/products/:id`

Update a product (PRODUCER only, must own product).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Product ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 400.00,
  "unit": "liter",
  "stock_quantity": 50.0,
  "image_url": "https://example.com/new-image.jpg"
}
```

---

### DELETE `/api/products/:id`

Soft delete a product (PRODUCER only, must own product).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (string, required): Product ID

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Cooperative Endpoints

### POST `/api/cooperatives/register`

Register a new cooperative (PRODUCER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Essaouira Argan Cooperative",
  "registration_number": "REG-ES-2024-001",
  "region": "Essaouira",
  "documents": {}
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Cooperative registered successfully",
  "data": {
    "cooperative": {
      "id": "coop_id",
      "name": "Essaouira Argan Cooperative",
      "registrationNumber": "REG-ES-2024-001",
      "region": "Essaouira",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "merchantAccount": {
      "merchantId": "merchant_id",
      "walletId": "wallet_id",
      "contractId": "contract_id"
    }
  }
}
```

---

### GET `/api/cooperatives`

Get list of cooperatives with filters.

**Query Parameters:**
- `region` (string, optional): Filter by region
- `search` (string, optional): Search in name/registration number
- `limit` (number, default: 20, max: 100): Results per page
- `offset` (number, default: 0): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cooperatives": [
      {
        "id": "coop_id",
        "name": "Essaouira Argan Cooperative",
        "registrationNumber": "REG-ES-2024-001",
        "region": "Essaouira",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "producer": {
          "id": "user_id",
          "email": "producer@example.com",
          "phone": "+212612345679"
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 10,
      "hasMore": false
    }
  }
}
```

---

### GET `/api/cooperatives/:id`

Get cooperative details with stats.

**Path Parameters:**
- `id` (string, required): Cooperative ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cooperative": {
      "id": "coop_id",
      "name": "Essaouira Argan Cooperative",
      "registrationNumber": "REG-ES-2024-001",
      "region": "Essaouira",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "producer": {
      "id": "user_id",
      "email": "producer@example.com",
      "phone": "+212612345679"
    },
    "stats": {
      "totalProducts": 10,
      "totalTransactions": 25,
      "rating": 4.8,
      "customerCount": 120
    },
    "recentProducts": [...]
  }
}
```

---

### GET `/api/cooperatives/:id/products`

Get products from a cooperative.

**Path Parameters:**
- `id` (string, required): Cooperative ID

**Query Parameters:**
- `limit` (number, default: 20, max: 100): Results per page
- `offset` (number, default: 0): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cooperativeId": "coop_id",
    "products": [...],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 10,
      "hasMore": false
    }
  }
}
```

---

## Dashboard Endpoints

### GET `/api/dashboard/stats`

Get dashboard statistics (PRODUCER only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "walletBalance": 5000.00,
    "totalRevenue": 25000.00,
    "totalTransactions": 50,
    "completedTransactions": 45,
    "pendingTransactions": 5,
    "averageTransactionValue": 555.56,
    "recentTransactions": [...]
  }
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: External API error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `MISSING_FIELDS`: Required fields are missing
- `INVALID_EMAIL`: Invalid email format
- `INVALID_PHONE`: Invalid phone format
- `INVALID_PASSWORD`: Password doesn't meet requirements
- `INVALID_CREDENTIALS`: Wrong email/phone or password
- `INVALID_TOKEN`: Invalid or expired token
- `USER_NOT_FOUND`: User doesn't exist
- `WALLET_NOT_ACTIVATED`: Wallet not activated
- `INSUFFICIENT_BALANCE`: Insufficient funds
- `PRODUCT_NOT_FOUND`: Product doesn't exist
- `TRANSACTION_NOT_FOUND`: Transaction doesn't exist
- `UNAUTHORIZED`: User doesn't have permission
- `CIH_API_ERROR`: CIH Bank API error
- `NETWORK_ERROR`: Network connection error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Wallet endpoints**: 10 requests per minute per user
- **Transaction endpoints**: 20 requests per minute per user
- **Product endpoints**: 30 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1609459200
```

---

## Webhooks

Webhooks are available for transaction status updates. Contact support to configure webhook endpoints.

---

**Last Updated**: 2024-01-01
**API Version**: 1.0.0

