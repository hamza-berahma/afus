# Afus ⴰⴼⵓⵙ 🌾

A full-stack agricultural marketplace platform connecting buyers with agricultural producers through secure escrow transactions, QR code-based delivery confirmation, and integrated mobile payment solutions.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [User Flows](#user-flows)
8. [Screenshots](#screenshots)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Contributing](#contributing)
12. [License](#license)

---

## 🎯 Project Overview

### What is Afus ⴰⴼⵓⵙ?

Afus ⴰⴼⵓⵙ is a digital platform designed to revolutionize agricultural commerce in Morocco by providing a secure, transparent marketplace where buyers can purchase agricultural products directly from producers and cooperatives. The platform ensures trust through escrow-based payments, real-time transaction tracking, and QR code-verified delivery confirmations.

### Problem It Solves

- **Trust Issues**: Buyers and producers often face payment and delivery disputes
- **Payment Security**: Lack of secure payment mechanisms in agricultural transactions
- **Market Access**: Small producers struggle to reach buyers directly
- **Transaction Transparency**: No clear tracking of order status and delivery
- **Payment Delays**: Producers wait for payment after delivery, buyers pay before receiving goods

### Key Features

- 🔐 **Secure Escrow System**: Payments held in escrow until delivery confirmation
- 📱 **QR Code Delivery Verification**: Scan QR codes to confirm delivery and release payments
- 💰 **Integrated Wallet System**: Direct integration with CIH Bank for seamless payments
- 📊 **Real-time Tracking**: Track transactions from initiation to settlement
- 🏪 **Producer Dashboard**: Manage products, orders, and sales analytics
- 🛒 **Product Catalog**: Browse and filter products by region, cooperative, and category
- 📧 **SMS Notifications**: Real-time updates via Twilio for order status changes
- 🔒 **Role-based Access**: Separate interfaces for Buyers, Producers, and Admins
- 📈 **Analytics**: Sales reports and transaction history for producers

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite 5.0** - Build tool and dev server
- **TailwindCSS 3.3** - Utility-first CSS framework
- **React Router DOM 6.20** - Client-side routing
- **Axios 1.6** - HTTP client
- **html5-qrcode 2.3** - QR code scanning
- **qrcode.react 3.1** - QR code generation
- **recharts 2.10** - Data visualization
- **@heroicons/react 2.1** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express 4.18** - Web framework
- **MongoDB** - NoSQL database (Mongoose ODM)
- **JWT (jsonwebtoken 9.0)** - Authentication
- **bcryptjs 2.4** - Password hashing
- **Axios 1.6** - HTTP client for external APIs
- **Twilio 4.20** - SMS notifications

### Mobile
- **React Native (Expo)** - Mobile framework
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation library
- **react-native-maps** - Maps integration
- **react-native-svg** - SVG support

### External APIs
- **CIH Bank API** - Payment processing and wallet management
- **Twilio** - SMS notifications

### Development Tools
- **Jest 29.7** - Testing framework
- **Supertest 6.3** - HTTP assertion library
- **Nodemon 3.0** - Development server auto-reload
- **Python 3** - Database seeding scripts

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
  ```bash
  node --version  # Should be v18.x or higher
  ```

- **MongoDB** (v6.0 or higher) or **MongoDB Atlas** account
  ```bash
  mongod --version  # Should be v6.0 or higher
  ```

- **npm** or **yarn** package manager

- **Python 3** (for database seeding)
  ```bash
  python3 --version  # Should be v3.8 or higher
  ```

### API Credentials Needed

1. **CIH Bank API**
   - `CIH_API_BASE_URL` - Base URL for CIH API
   - `CIH_API_KEY` - API authentication key
   - `CIH_HOLDING_WALLET_ID` - Escrow holding wallet identifier

2. **Twilio**
   - `TWILIO_ACCOUNT_SID` - Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Twilio authentication token
   - `TWILIO_PHONE_NUMBER` - Twilio phone number for sending SMS

3. **JWT Secret**
   - `JWT_SECRET` - Secret key for JWT token signing

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bank
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Mobile
```bash
cd mobile
npm install
```

### 3. Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/sou9na
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sou9na

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CIH API
CIH_API_BASE_URL=https://api.cih.com
CIH_API_KEY=your-cih-api-key
CIH_HOLDING_WALLET_ID=your-holding-wallet-id

# Banking Service (use mock if not set)
USE_MOCK_BANKING=true

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Database Setup

1. **MongoDB Connection:**
   - For local MongoDB: Ensure MongoDB is running
   - For MongoDB Atlas: Use the connection string in `.env`

2. **Seed Database (Optional):**
   ```bash
   cd backend/db
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python3 seed_data.py
   ```
   
   This will populate the database with:
   - 1,200+ users (buyers, producers, admins)
   - 120+ cooperatives
   - 960+ products with images
   - 2,000+ transactions with logs

### 5. Run Development Servers

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

#### Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default port)

#### Start Mobile App

In a new terminal:

```bash
cd mobile
npm start
```

The mobile app will run in Expo. Use the Expo Go app on your phone or an emulator.

---

## 📁 Project Structure

```
bank/
├── backend/                    # Backend API server
│   ├── api/                    # Express route handlers
│   │   ├── auth.js            # Authentication routes (register, login, refresh)
│   │   ├── wallet.js          # Wallet operations (balance, transactions, activate)
│   │   ├── transactions.js    # Transaction management (create, ship, confirm)
│   │   ├── products.js        # Product CRUD operations
│   │   ├── cooperatives.js    # Cooperative management
│   │   └── index.js           # Main API router
│   ├── config/                 # Configuration files
│   │   ├── database.js        # Database connection config
│   │   └── api.js             # External API config (CIH, Twilio, JWT)
│   ├── db/                     # Database files
│   │   ├── connection.js       # PostgreSQL connection pool
│   │   ├── schema.sql          # Database schema
│   │   └── migrations/        # Database migrations
│   ├── middleware/             # Express middleware
│   │   ├── auth.js            # JWT authentication & authorization
│   │   └── errorHandler.js    # Error handling middleware
│   ├── services/               # Business logic services
│   │   ├── cihApi.js          # CIH Bank API integration
│   │   ├── transactionService.js  # Transaction business logic
│   │   └── notificationService.js # Twilio SMS notifications
│   ├── tests/                  # Test files
│   │   ├── api.test.js        # API endpoint tests
│   │   ├── mocks/             # Mock implementations
│   │   └── setup.js           # Test setup/teardown
│   ├── server.js              # Express app entry point
│   ├── package.json           # Backend dependencies
│   └── jest.config.js         # Jest configuration
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── ui/           # UI primitives (Button, Input, Card, etc.)
│   │   │   ├── ProductForm.jsx      # Product creation/editing form
│   │   │   ├── PaymentConfirmModal.jsx  # Payment confirmation modal
│   │   │   ├── QRScanner.jsx        # QR code scanner component
│   │   │   ├── ShipmentFlow.jsx    # Producer shipment workflow
│   │   │   ├── Navigation.jsx      # Main navigation component
│   │   │   ├── ProtectedRoute.jsx # Route protection wrapper
│   │   │   ├── LoadingStates.jsx   # Loading state components
│   │   │   └── ErrorStates.jsx    # Error state components
│   │   ├── pages/            # Page components
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── WalletDashboard.jsx # Buyer wallet dashboard
│   │   │   ├── ProductCatalog.jsx  # Product browsing page
│   │   │   ├── TransactionDetails.jsx  # Transaction detail view
│   │   │   └── ProducerDashboard.jsx   # Producer dashboard
│   │   ├── context/          # React Context providers
│   │   │   └── AuthContext.jsx    # Authentication state management
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useFormValidation.js  # Form validation hook
│   │   ├── services/        # API service layer
│   │   │   └── api.js        # Axios instance & API functions
│   │   ├── utils/            # Utility functions
│   │   │   └── validation.js # Validation helper functions
│   │   ├── styles/           # Style files
│   │   │   └── theme.js      # Theme configuration
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # React entry point
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # TailwindCSS configuration
│
└── docs/                      # Documentation files
    └── (API documentation, etc.)
```

---

## 📚 API Documentation

For detailed API documentation, including endpoints, request/response formats, and authentication requirements, see:

- **[API_DOCS.md](./API_DOCS.md)** - Complete API reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture documentation

### Quick API Overview

#### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

#### Wallet Endpoints
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/activate` - Activate wallet

#### Transaction Endpoints
- `POST /api/transactions/simulate` - Simulate transaction fees
- `POST /api/transactions/create` - Create escrow transaction
- `POST /api/transactions/:id/ship` - Mark as shipped (producer)
- `POST /api/transactions/:id/confirm-delivery` - Confirm delivery (buyer)
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions/:id/dispute` - Create dispute

#### Product Endpoints
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (producer)
- `PUT /api/products/:id` - Update product (producer)
- `DELETE /api/products/:id` - Soft delete product (producer)

#### Cooperative Endpoints
- `POST /api/cooperatives/register` - Register cooperative
- `GET /api/cooperatives` - List cooperatives
- `GET /api/cooperatives/:id` - Get cooperative details
- `GET /api/cooperatives/:id/products` - Get cooperative products

---

## 👥 User Flows

### Buyer Journey

1. **Registration/Login**
   - Register as BUYER or login with email/phone
   - Activate wallet (linked to CIH account)

2. **Browse Products**
   - Browse product catalog
   - Filter by region, cooperative, category
   - View product details

3. **Purchase Flow**
   - Select product and quantity
   - Simulate transaction (see fees)
   - Confirm payment (creates escrow)
   - Payment held in escrow

4. **Delivery Confirmation**
   - Receive SMS notification when shipped
   - Producer provides QR code
   - Scan QR code to confirm delivery
   - Payment released to producer
   - Transaction marked as SETTLED

5. **Transaction History**
   - View all transactions in wallet dashboard
   - Track order status
   - View transaction details and logs

### Producer Journey

1. **Registration/Login**
   - Register as PRODUCER
   - Register cooperative (creates merchant account)
   - Activate wallet

2. **Product Management**
   - Add products with details (name, price, unit, stock)
   - Edit existing products
   - Manage stock quantities
   - Soft delete products

3. **Order Management**
   - View active orders in dashboard
   - See orders in ESCROWED status
   - Mark orders as SHIPPED
   - Generate QR code for delivery

4. **Sales Analytics**
   - View total revenue
   - Track completed transactions
   - See average transaction value
   - View sales charts and trends

5. **Payment Receipt**
   - Receive payment when buyer confirms delivery
   - View transaction history
   - Track wallet balance

---

## 📸 Screenshots

> **Note**: Screenshots should be added here showing key UI screens:
> - Login/Register pages
> - Product catalog
> - Wallet dashboard
> - Producer dashboard
> - Transaction details
> - QR code scanner

### Key UI Screens

1. **Login Page** - Clean authentication interface
2. **Product Catalog** - Grid view with filters and search
3. **Wallet Dashboard** - Balance display and transaction history
4. **Producer Dashboard** - Analytics, orders, and product management
5. **Transaction Details** - Timeline view with status tracking
6. **QR Scanner** - Camera-based QR code scanning interface

---

## 🧪 Testing

### Backend Tests

The backend uses Jest for testing with comprehensive API test coverage.

#### Setup Test Database

```bash
# Create test database
createdb sou9na_test

# Run schema
psql sou9na_test < backend/db/schema.sql

# Create .env.test file
cd backend
cp .env.test.example .env.test
# Edit .env.test with test database credentials
```

#### Run Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Test Coverage

Tests cover:
- ✅ Authentication (register, login, refresh)
- ✅ Wallet operations (balance, transactions, activation)
- ✅ Transaction flow (simulate, create, ship, confirm)
- ✅ Error scenarios (timeouts, invalid IDs, network errors)
- ✅ End-to-end transaction lifecycle

### Frontend Tests

> **Note**: Frontend testing setup can be added with React Testing Library or similar.

---

## 🚢 Deployment

### Production Considerations

#### Environment Variables

Ensure all production environment variables are set:

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/sou9na_prod
JWT_SECRET=<strong-secret-key>
CIH_API_BASE_URL=<production-cih-api-url>
CIH_API_KEY=<production-api-key>
CIH_HOLDING_WALLET_ID=<production-wallet-id>
TWILIO_ACCOUNT_SID=<production-twilio-sid>
TWILIO_AUTH_TOKEN=<production-twilio-token>
TWILIO_PHONE_NUMBER=<production-phone>
```

**Frontend (.env.production)**
```env
VITE_API_BASE_URL=https://api.sou9na.com/api
```

#### Database

1. **Production Database Setup:**
   - Use MongoDB Atlas for production
   - Configure connection string in environment variables
   - Enable authentication and IP whitelisting
   - Set up automated backups

2. **Database Backups:**
   - MongoDB Atlas provides automated backups
   - Configure backup retention policies
   - Test restore procedures regularly

#### Security

1. **JWT Secret**: Use a strong, randomly generated secret
2. **HTTPS**: Enable SSL/TLS for all API endpoints
3. **CORS**: Configure allowed origins for production
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: All inputs validated on backend
6. **SQL Injection**: Use parameterized queries (already implemented)

#### Build & Deploy

**Backend:**
```bash
cd backend
npm install --production
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Deploy the 'dist' folder to your hosting service
```

**Mobile:**
```bash
cd mobile
npm install
npm run build
# Follow Expo deployment guide for app stores
```

#### Recommended Hosting

- **Backend**: Node.js hosting (Heroku, Railway, AWS, DigitalOcean)
- **Frontend**: Static hosting (Vercel, Netlify, AWS S3 + CloudFront)
- **Mobile**: Expo EAS Build for app stores
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB

---

## 🤝 Contributing

### Hackathon Team

This project was developed as part of a hackathon. Team members:

> **Note**: Add team member names and roles here

- **Backend Developer**: [Name]
- **Frontend Developer**: [Name]
- **UI/UX Designer**: [Name]
- **DevOps**: [Name]

### Development Guidelines

1. **Code Style**: Follow existing code patterns
2. **Commits**: Use descriptive commit messages
3. **Branches**: Create feature branches for new work
4. **Testing**: Write tests for new features
5. **Documentation**: Update README for significant changes

### Getting Started for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test` in backend)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- CIH Bank for payment API integration
- Twilio for SMS notification services
- All open-source contributors whose libraries made this project possible

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ for the agricultural community in Morocco**
