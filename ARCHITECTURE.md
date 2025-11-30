# Afus ⴰⴼⵓⵙ Architecture Documentation

Complete system architecture documentation for the Afus platform, including system design, component interactions, data flows, and technical decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Mobile Architecture](#mobile-architecture)
7. [Database Schema](#database-schema)
8. [Service Layer Architecture](#service-layer-architecture)
9. [API Design](#api-design)
10. [Security Architecture](#security-architecture)
11. [Data Flow Diagrams](#data-flow-diagrams)
12. [Deployment Architecture](#deployment-architecture)

---

## System Overview

**Afus ⴰⴼⵓⵙ** is a full-stack agricultural marketplace platform connecting buyers with agricultural producers through secure escrow transactions, QR code-based delivery confirmation, and integrated mobile payment solutions.

### Core Features

- **Secure Escrow System**: Payments held in escrow until delivery confirmation
- **QR Code Verification**: Cryptographic signatures for delivery confirmation
- **Wallet Management**: Complete wallet operations (refill, withdraw, transfer)
- **Role-Based Access**: BUYER, PRODUCER, and ADMIN roles
- **Real-Time Tracking**: Transaction lifecycle with status updates
- **SMS Notifications**: Real-time updates via Twilio integration
- **Cooperative Management**: Producer cooperatives with ratings and analytics

### Key Principles

- **Security First**: Escrow payments, QR code verification, JWT authentication
- **Scalability**: MongoDB for flexible data storage, service-oriented architecture
- **Reliability**: Retry logic, error handling, transaction safety
- **Developer Experience**: Clear separation of concerns, comprehensive documentation

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Web Frontend    │              │  Mobile App      │        │
│  │  (React + Vite)  │              │  (React Native)  │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
└───────────┼──────────────────────────────────┼──────────────────┘
            │ HTTP/REST + JWT                  │
            │                                  │
┌───────────▼──────────────────────────────────▼──────────────────┐
│                    Backend API (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Routes     │  │  Middleware  │  │   Services   │         │
│  │  - Auth      │  │  - Auth      │  │  - Banking   │         │
│  │  - Wallet    │  │  - Error     │  │  - Wallet API│         │
│  │  - Products  │  │  - Role      │  │  - Transaction│         │
│  │  - Transactions│ │  - Validation│ │  - SMS       │         │
│  │  - Cooperatives│              │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────┬──────────────────────────────────────────────────────┘
            │
    ┌───────┼───────┬──────────────┬──────────────┐
    │       │       │              │              │
┌───▼───┐ ┌─▼───┐ ┌─▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│MongoDB│ │CIH  │ │Twilio  │ │Cooperative│ │  External  │
│ Atlas │ │Bank │ │  SMS   │ │  Score   │ │   APIs     │
│       │ │ API │ │        │ │ Service  │ │            │
└───────┘ └─────┘ └────────┘ └─────────┘ └─────────────┘
```

---

## Technology Stack

### Backend

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.18
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Password Hashing**: bcryptjs 2.4
- **HTTP Client**: Axios 1.6
- **SMS Service**: Twilio 4.20

### Frontend (Web)

- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Styling**: TailwindCSS 3.3
- **Routing**: React Router DOM 6.20
- **HTTP Client**: Axios 1.6
- **QR Code**: html5-qrcode 2.3, qrcode.react 3.1
- **Charts**: Recharts 2.10
- **Icons**: @heroicons/react 2.1

### Mobile

- **Framework**: React Native (Expo)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation
- **Maps**: react-native-maps
- **SVG**: react-native-svg
- **HTTP Client**: Axios

### External Services

- **CIH Bank API**: Payment processing and wallet management
- **Twilio**: SMS notifications
- **MongoDB Atlas**: Cloud database hosting

---

## Backend Architecture

### Directory Structure

```
backend/
├── api/                    # Express route handlers
│   ├── auth.js            # Authentication routes
│   ├── wallet.js          # Wallet operations
│   ├── wallet-api.js      # Wallet API endpoints
│   ├── transactions.js    # Transaction management
│   ├── products.js        # Product CRUD
│   ├── cooperatives.js    # Cooperative management
│   ├── dashboard.js       # Dashboard statistics
│   └── index.js           # Main API router
├── services/              # Business logic services
│   ├── banking/          # Banking service (Adapter Pattern)
│   │   ├── index.js      # Service factory
│   │   ├── CIHLiveProvider.js
│   │   ├── MockBankingProvider.js
│   │   └── types.js
│   ├── wallet-api/       # Wallet Management API
│   │   ├── index.js      # Service factory
│   │   ├── CIHWalletProvider.js
│   │   ├── MockWalletProvider.js
│   │   ├── types.js
│   │   └── utils/
│   ├── transactionService.js  # Transaction orchestration
│   ├── CooperativeScoreService.js  # Cooperative rating
│   └── notificationService.js  # SMS notifications
├── db/                    # Database files
│   ├── connection.js     # MongoDB connection
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Cooperative.js
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   └── TransactionLog.js
│   └── seed_data.py      # Database seeding script
├── middleware/           # Express middleware
│   ├── auth.js          # JWT authentication
│   └── errorHandler.js   # Error handling
└── server.js            # Express app entry point
```

### Request Flow

```
Client Request
    │
    ├─► Express Middleware (CORS, JSON parsing)
    │
    ├─► Authentication Middleware (JWT verification)
    │
    ├─► Role Check Middleware (if required)
    │
    ├─► Route Handler
    │   │
    │   ├─► Input Validation
    │   │
    │   ├─► Service Layer (Business Logic)
    │   │   │
    │   │   ├─► Database Operations (Mongoose)
    │   │   │
    │   │   ├─► External API Calls (CIH, Twilio)
    │   │   │
    │   │   └─► Data Transformation
    │   │
    │   └─► Response Formatting
    │
    └─► Error Handler (if error occurs)
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── ui/          # UI primitives
│   │   ├── layout/      # Layout components
│   │   └── features/    # Feature-specific components
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Products.tsx
│   │   ├── Transactions.tsx
│   │   └── ProducerDashboard.tsx
│   ├── context/         # React Context
│   │   └── AuthContext.tsx
│   ├── services/        # API service layer
│   │   └── api.ts
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── styles/          # Style files
│   │   └── theme.js
│   ├── App.tsx          # Main App component
│   └── main.tsx         # React entry point
├── public/              # Static assets
└── package.json
```

### Component Hierarchy

```
App
├── Navigation
├── Routes
│   ├── Home
│   ├── Products
│   │   └── ProductCard
│   ├── Transactions
│   │   └── TransactionCard
│   ├── Wallet
│   │   └── WalletDashboard
│   └── ProducerDashboard
│       ├── Stats
│       └── ProductForm
└── Footer
```

---

## Mobile Architecture

### Directory Structure

```
mobile/
├── src/
│   ├── components/      # Reusable components
│   │   ├── ui/         # shadcn-style components
│   │   ├── Logo.tsx
│   │   ├── Map.tsx
│   │   └── ProductCard.tsx
│   ├── screens/        # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   └── TransactionsScreen.tsx
│   ├── context/        # React Context
│   │   └── AuthContext.tsx
│   ├── services/       # API service layer
│   │   └── api.ts
│   ├── theme/         # Theme configuration
│   │   └── colors.ts
│   └── App.tsx
└── assets/            # Static assets
```

---

## Database Schema

### Entity Relationship Diagram

```
User (1) ──< (1) Cooperative
  │              │
  │              │
  │              └──< (N) Product
  │
  ├──< (N) Transaction (as buyer)
  │
  └──< (N) Transaction (as seller)

Transaction (1) ──< (N) TransactionLog
Transaction (N) ──> (1) Product
```

### Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed, lowercase),
  phone: String (unique, indexed),
  passwordHash: String,
  role: Enum['BUYER', 'PRODUCER', 'ADMIN'] (indexed),
  walletId: String (indexed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Cooperatives Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique, indexed),
  name: String,
  registrationNumber: String (indexed),
  region: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection

```javascript
{
  _id: ObjectId,
  cooperativeId: ObjectId (ref: 'Cooperative', indexed),
  name: String,
  description: String,
  price: Number (min: 0),
  unit: String,
  stockQuantity: Number (default: 0, min: 0),
  imageUrl: String,
  imageUrls: [String],
  deletedAt: Date (indexed), // Soft delete
  createdAt: Date,
  updatedAt: Date
}
```

#### Transactions Collection

```javascript
{
  _id: ObjectId,
  buyerId: ObjectId (ref: 'User', indexed),
  sellerId: ObjectId (ref: 'User', indexed),
  productId: ObjectId (ref: 'Product', indexed),
  quantity: Number,
  amount: Number (min: 0),
  fee: Number (default: 0, min: 0),
  totalAmount: Number (min: 0),
  status: Enum['INITIATED', 'ESCROWED', 'SHIPPED', 'DELIVERED', 'SETTLED', 'FAILED'] (indexed),
  escrowTransactionId: String (indexed),
  qrSignature: String,
  settledAt: Date,
  createdAt: Date (indexed, descending),
  updatedAt: Date
}
```

#### TransactionLogs Collection

```javascript
{
  _id: ObjectId,
  transactionId: ObjectId (ref: 'Transaction', indexed),
  status: String (indexed),
  message: String,
  apiResponse: Mixed,
  createdAt: Date (indexed, descending)
}
```

---

## Service Layer Architecture

### Banking Service (Adapter Pattern)

The banking service uses the **Adapter Pattern** to provide a unified interface:

```javascript
IBankingProvider
├── CIHLiveProvider    // Real CIH Bank API
└── MockBankingProvider // Mock implementation
```

**Key Methods:**
- `getBalance(contractId)`
- `simulateTransfer(request)`
- `executeTransfer(request)`
- `cashIn(request)`
- `cashOut(request)`
- `releaseEscrow(request)`

**Configuration:**
- Automatically switches between live and mock based on environment variables
- Retry logic with exponential backoff
- Comprehensive error handling

### Wallet API Service

Complete wallet management API following CIH Bank specification:

```javascript
IWalletProvider
├── CIHWalletProvider    // Real CIH Wallet API
└── MockWalletProvider   // Mock implementation
```

**Key Operations:**
- Wallet creation (pre-create, create)
- Balance inquiry
- Transaction history
- Cash in/out
- Wallet-to-wallet transfers
- QR code operations

### Transaction Service

Orchestrates the complete transaction lifecycle:

1. **Simulation**: Calculate fees
2. **Creation**: Create escrow transaction
3. **Shipment**: Generate QR code
4. **Delivery**: Verify QR signature
5. **Settlement**: Release escrow funds

### Cooperative Score Service

Calculates dynamic ratings and customer counts based on transaction data:

- **Rating**: Based on success rate, transaction volume, account stability
- **Customer Count**: Number of unique buyers

---

## API Design

### RESTful Principles

- **Resource-Based URLs**: `/api/products`, `/api/transactions`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: Proper HTTP status codes for all responses
- **Consistent Response Format**: All responses follow the same structure

### Authentication

- **JWT Tokens**: Access tokens (15 min) and refresh tokens (7 days)
- **Bearer Token**: `Authorization: Bearer <token>`
- **Role-Based Access**: Middleware enforces role restrictions

### Error Handling

- **Consistent Error Format**: All errors follow the same structure
- **Error Codes**: Machine-readable error codes
- **HTTP Status Codes**: Proper status codes for different error types

---

## Security Architecture

### Authentication & Authorization

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Short-lived access tokens, longer refresh tokens
- **Role-Based Access Control**: Middleware enforces role restrictions
- **Token Refresh**: Automatic token refresh mechanism

### Data Security

- **Input Validation**: All inputs validated before processing
- **SQL Injection Prevention**: MongoDB uses parameterized queries
- **XSS Prevention**: Input sanitization, output encoding
- **CSRF Protection**: Token-based CSRF protection

### Transaction Security

- **Escrow System**: Funds held until delivery confirmation
- **QR Code Signatures**: HMAC-SHA256 with JWT_SECRET, 24-hour expiry
- **Transaction Logging**: Complete audit trail
- **MongoDB Transactions**: Atomic operations for critical flows

### API Security

- **Rate Limiting**: Prevents abuse
- **HTTPS**: All API endpoints use HTTPS
- **CORS**: Configured for allowed origins
- **API Key Management**: Secure storage of API keys

---

## Data Flow Diagrams

### Complete Transaction Flow

```
1. Buyer browses products
   ↓
2. Buyer simulates transaction (calculate fees)
   ↓
3. Buyer creates transaction (funds escrowed)
   ↓
4. Producer ships product (QR code generated)
   ↓
5. Buyer scans QR code (delivery confirmed)
   ↓
6. Escrow released to producer (transaction settled)
```

### Wallet Activation Flow

```
1. User registers
   ↓
2. User activates wallet (CIH API)
   ↓
3. Wallet ID stored in user document
   ↓
4. User can now make transactions
```

### Product Creation Flow

```
1. Producer registers cooperative
   ↓
2. Producer creates products
   ↓
3. Products listed in catalog
   ↓
4. Buyers can browse and purchase
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────┐
│         Load Balancer / CDN            │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ Web   │ │ Web   │ │ Web   │
│Server │ │Server │ │Server │
└───┬───┘ └───┬───┘ └───┬───┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────▼──────────┐
    │   Backend API      │
    │   (Express.js)     │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│MongoDB│ │ CIH   │ │Twilio │
│ Atlas │ │ Bank  │ │  SMS  │
└───────┘ └───────┘ └───────┘
```

### Environment Variables

**Backend:**
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `CIH_API_BASE_URL`: CIH Bank API URL
- `CIH_API_KEY`: CIH Bank API key
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `USE_MOCK_BANKING`: Use mock banking (true/false)

**Frontend:**
- `VITE_API_BASE_URL`: Backend API URL

---

## Performance Optimizations

### Database

- **Indexes**: All foreign keys and frequently queried fields indexed
- **Connection Pooling**: MongoDB connection pooling
- **Query Optimization**: Uses Mongoose `.lean()` for read-only queries
- **Pagination**: All list endpoints support pagination

### API

- **Caching**: Response caching where appropriate
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Retry Logic**: Exponential backoff for external API calls
- **Request Timeouts**: 30-second timeout for external API calls

### Frontend

- **Code Splitting**: Lazy loading for routes
- **Image Optimization**: Optimized images, lazy loading
- **Bundle Size**: Tree shaking, minification

---

## Monitoring & Logging

### Logging

- **Request Logging**: All API requests logged
- **Error Logging**: Comprehensive error logging with context
- **Transaction Logging**: Complete audit trail for transactions
- **External API Logging**: All external API calls logged

### Monitoring

- **Health Checks**: `/health` and `/health/db` endpoints
- **Error Tracking**: Error tracking and alerting
- **Performance Metrics**: Response times, error rates
- **Database Monitoring**: Connection status, query performance

---

## Future Enhancements

### Planned Features

- **WebSocket Support**: Real-time updates
- **GraphQL API**: Alternative API interface
- **Microservices**: Service decomposition
- **Caching Layer**: Redis for caching
- **Message Queue**: RabbitMQ/Kafka for async processing
- **Search Engine**: Elasticsearch for product search
- **Analytics**: Advanced analytics and reporting

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0

