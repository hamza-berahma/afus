import { connectDB, testConnection, disconnectDB } from './connection.js';
import User from './models/User.js';
import Cooperative from './models/Cooperative.js';
import Product from './models/Product.js';
import Transaction from './models/Transaction.js';
import TransactionLog from './models/TransactionLog.js';
import { hashPassword } from '../middleware/auth.js';
import { activateClientAccount } from '../services/cihApi.js';
import dotenv from 'dotenv';

dotenv.config();

// Default password for all test users
const DEFAULT_PASSWORD = 'TestPass123!';

/**
 * Log with timestamp
 */
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

/**
 * Log error
 */
const logError = (message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
};

/**
 * Clear existing data (idempotent)
 */
const clearData = async () => {
  log('Clearing existing data...');
  
  try {
    // Delete in correct order to respect references
    await TransactionLog.deleteMany({});
    log('  ✓ Cleared transaction_logs');
    
    await Transaction.deleteMany({});
    log('  ✓ Cleared transactions');
    
    await Product.deleteMany({});
    log('  ✓ Cleared products');
    
    await Cooperative.deleteMany({});
    log('  ✓ Cleared cooperatives');
    
    await User.deleteMany({});
    log('  ✓ Cleared users');
    
    log('Data cleared successfully');
  } catch (error) {
    logError('Error clearing data', error);
    throw error;
  }
};

/**
 * Create test users
 */
const createUsers = async () => {
  log('Creating test users...');
  
  const users = [
    // Buyers
    {
      email: 'buyer1@test.com',
      phone: '+212612345678',
      password: DEFAULT_PASSWORD,
      role: 'BUYER',
    },
    {
      email: 'buyer2@test.com',
      phone: '+212612345679',
      password: DEFAULT_PASSWORD,
      role: 'BUYER',
    },
    {
      email: 'buyer3@test.com',
      phone: '+212612345680',
      password: DEFAULT_PASSWORD,
      role: 'BUYER',
    },
    // Producers
    {
      email: 'producer1@test.com',
      phone: '+212612345681',
      password: DEFAULT_PASSWORD,
      role: 'PRODUCER',
    },
    {
      email: 'producer2@test.com',
      phone: '+212612345682',
      password: DEFAULT_PASSWORD,
      role: 'PRODUCER',
    },
    {
      email: 'producer3@test.com',
      phone: '+212612345683',
      password: DEFAULT_PASSWORD,
      role: 'PRODUCER',
    },
    {
      email: 'producer4@test.com',
      phone: '+212612345684',
      password: DEFAULT_PASSWORD,
      role: 'PRODUCER',
    },
    // Admin
    {
      email: 'admin@test.com',
      phone: '+212612345690',
      password: DEFAULT_PASSWORD,
      role: 'ADMIN',
    },
  ];

  const createdUsers = [];

  for (const userData of users) {
    try {
      const passwordHash = await hashPassword(userData.password);
      
      // Create user first
      const user = await User.create({
        email: userData.email,
        phone: userData.phone,
        passwordHash,
        role: userData.role,
        walletId: null, // Will be set after activation
      });
      
      // Automatically activate wallet using mock API (will have 1k MAD)
      let walletId = null;
      try {
        const activationData = await activateClientAccount({
          phone: user.phone,
          email: user.email,
        });
        
        walletId = activationData.walletId || activationData.contractId;
        
        // Update user with wallet ID
        await User.findByIdAndUpdate(user._id, {
          $set: { walletId },
        });
        
        user.walletId = walletId;
        log(`  ✓ Created user: ${user.email} (${user.role}) - Wallet: ${walletId} (1,000 MAD)`);
      } catch (error) {
        logError(`Wallet activation failed for ${userData.email}`, error);
        log(`  ⚠️  Created user: ${user.email} (${user.role}) - Wallet activation failed`);
      }
      
      createdUsers.push(user);
    } catch (error) {
      logError(`Error creating user ${userData.email}`, error);
      throw error;
    }
  }

  log(`Created ${createdUsers.length} users`);
  return createdUsers;
};

/**
 * Create cooperatives
 */
const createCooperatives = async (users) => {
  log('Creating cooperatives...');
  
  const producers = users.filter(u => u.role === 'PRODUCER');
  if (producers.length === 0) {
    throw new Error('Producer users not found');
  }

  const cooperatives = [
    {
      name: 'Essaouira Argan Cooperative',
      userId: producers[0]._id,
      registrationNumber: 'REG-ES-2024-001',
      region: 'Essaouira',
      latitude: 31.5085,
      longitude: -9.7595,
      address: 'Avenue Oqba Ibn Nafiaa, Essaouira, Morocco',
    },
    {
      name: 'Taliouine Saffron Collective',
      userId: producers[1]._id,
      registrationNumber: 'REG-TA-2024-002',
      region: 'Taliouine',
      latitude: 30.5333,
      longitude: -7.9167,
      address: 'Route de Taliouine, Taliouine, Morocco',
    },
    {
      name: 'Fes Olive Grove Cooperative',
      userId: producers[2]._id,
      registrationNumber: 'REG-FE-2024-003',
      region: 'Fes',
      latitude: 34.0331,
      longitude: -5.0003,
      address: 'Boulevard Allal Ben Abdellah, Fes, Morocco',
    },
    {
      name: 'Marrakech Spice Collective',
      userId: producers[3]._id,
      registrationNumber: 'REG-MA-2024-004',
      region: 'Marrakech',
      latitude: 31.6295,
      longitude: -7.9811,
      address: 'Jemaa el-Fnaa, Marrakech, Morocco',
    },
    {
      name: 'Atlas Honey Cooperative',
      userId: producers[0]._id,
      registrationNumber: 'REG-AT-2024-005',
      region: 'Atlas Mountains',
      latitude: 31.0833,
      longitude: -7.9167,
      address: 'Route de l\'Atlas, Imlil, Morocco',
    },
    {
      name: 'Safi Ceramics Cooperative',
      userId: producers[1]._id,
      registrationNumber: 'REG-SA-2024-006',
      region: 'Safi',
      latitude: 32.2994,
      longitude: -9.2372,
      address: 'Avenue Hassan II, Safi, Morocco',
    },
  ];

  const createdCooperatives = [];
  const { createMerchantAccount } = await import('../services/cihApi.js');

  for (const coopData of cooperatives) {
    try {
      // Get producer user details for merchant account
      const producerUser = await User.findById(coopData.userId);
      
      if (!producerUser) {
        logError(`Producer user not found for cooperative ${coopData.name}`, new Error('User not found'));
        continue;
      }
      
      // Create merchant account (wallet) for cooperative using mock API
      let merchantWalletId = null;
      try {
        const merchantData = await createMerchantAccount({
          name: coopData.name,
          registrationNumber: coopData.registrationNumber,
          phone: producerUser.phone,
          email: producerUser.email,
          region: coopData.region,
        });
        
        merchantWalletId = merchantData.walletId || merchantData.contractId;
        log(`  ✓ Created merchant wallet for ${coopData.name}: ${merchantWalletId} (1,000 MAD)`);
      } catch (error) {
        logError(`Merchant account creation failed for ${coopData.name}`, error);
      }
      
      const cooperative = await Cooperative.create(coopData);
      
      createdCooperatives.push(cooperative);
      const locationInfo = cooperative.latitude && cooperative.longitude 
        ? `📍 ${cooperative.latitude.toFixed(4)}, ${cooperative.longitude.toFixed(4)}`
        : '📍 No location data';
      log(`  ✓ Created cooperative: ${cooperative.name} (${cooperative.region}) ${locationInfo}`);
    } catch (error) {
      logError(`Error creating cooperative ${coopData.name}`, error);
      throw error;
    }
  }

  log(`Created ${createdCooperatives.length} cooperatives`);
  return createdCooperatives;
};

/**
 * Create products
 */
const createProducts = async (cooperatives) => {
  log('Creating products...');
  
  const essaouiraCoop = cooperatives.find(c => c.region === 'Essaouira');
  const taliouineCoop = cooperatives.find(c => c.region === 'Taliouine');
  const fesCoop = cooperatives.find(c => c.region === 'Fes');
  const marrakechCoop = cooperatives.find(c => c.region === 'Marrakech');
  const atlasCoop = cooperatives.find(c => c.region === 'Atlas Mountains');
  const safiCoop = cooperatives.find(c => c.region === 'Safi');
  
  if (!essaouiraCoop || !taliouineCoop || !fesCoop || !marrakechCoop || !atlasCoop || !safiCoop) {
    throw new Error('Required cooperatives not found');
  }

  const products = [
    // Essaouira Argan Cooperative - Argan Products
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Premium Organic Argan Oil (Culinary)',
      description: 'Cold-pressed organic argan oil from the argan forests of Essaouira. Rich in vitamin E, omega-6, and antioxidants. Perfect for drizzling over salads, couscous, and traditional Moroccan dishes. Certified organic and sustainably sourced.',
      price: 380.00,
      unit: 'liter',
      stockQuantity: 52.5,
    },
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Cosmetic Argan Oil',
      description: 'Pure cosmetic-grade argan oil for skin and hair care. Rich in vitamin E and fatty acids. Helps moisturize, reduce wrinkles, and strengthen hair. 100% pure, unrefined, and cold-pressed.',
      price: 320.00,
      unit: 'liter',
      stockQuantity: 68.0,
    },
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Raw Argan Nuts',
      description: 'Premium raw argan nuts directly from Essaouira argan forests. High quality nuts ready for processing. Rich in natural oils and nutrients. Sustainably harvested by local women cooperatives.',
      price: 135.00,
      unit: 'kg',
      stockQuantity: 185.0,
    },
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Argan Honey',
      description: 'Pure argan honey collected from beehives in the argan forests. Rich, golden, and naturally sweet with a unique floral aroma. Rich in antioxidants and enzymes. Perfect for breakfast or tea.',
      price: 195.00,
      unit: 'kg',
      stockQuantity: 42.0,
    },
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Handmade Argan Soap',
      description: 'Traditional handmade argan oil soap. Moisturizing and nourishing for all skin types. Contains pure argan oil, natural glycerin, and essential oils. Perfect for daily skincare routine.',
      price: 48.00,
      unit: 'piece',
      stockQuantity: 125,
    },
    {
      cooperativeId: essaouiraCoop._id,
      name: 'Organic Almonds',
      description: 'Premium organic almonds from Essaouira region. Large, crunchy, and naturally sweet. Perfect for snacking, baking, or making traditional Moroccan almond paste. Rich in protein and healthy fats.',
      price: 105.00,
      unit: 'kg',
      stockQuantity: 275.0,
    },
    
    // Taliouine Saffron Collective - Saffron Products
    {
      cooperativeId: taliouineCoop._id,
      name: 'Premium Saffron Threads (Grade A)',
      description: 'Grade A saffron threads from Taliouine, the saffron capital of Morocco. Intense red color, powerful aroma, and exceptional quality. 1g contains approximately 500 threads. Perfect for paella, risotto, and traditional Moroccan tagines.',
      price: 920.00,
      unit: 'g',
      stockQuantity: 180.0,
    },
    {
      cooperativeId: taliouineCoop._id,
      name: 'Saffron Powder',
      description: 'Finely ground premium saffron from Taliouine. Easy to use in cooking and baking. Maintains the intense color and aroma of whole threads. Perfect for sauces, desserts, and beverages.',
      price: 820.00,
      unit: 'g',
      stockQuantity: 95.0,
    },
    {
      cooperativeId: taliouineCoop._id,
      name: 'Saffron Tea',
      description: 'Premium saffron-infused tea blend. Aromatic and flavorful with health benefits. Perfect for relaxation and wellness. Contains pure Taliouine saffron and premium green tea.',
      price: 185.00,
      unit: '100g',
      stockQuantity: 150.0,
    },
    
    // Fes Olive Grove Cooperative - Olive Products
    {
      cooperativeId: fesCoop._id,
      name: 'Extra Virgin Olive Oil',
      description: 'Premium extra virgin olive oil from Fes olive groves. Cold-pressed, unfiltered, and full of flavor. Rich in antioxidants and monounsaturated fats. Perfect for cooking, salads, and dipping.',
      price: 110.00,
      unit: 'liter',
      stockQuantity: 145.0,
    },
    {
      cooperativeId: fesCoop._id,
      name: 'Green Olives (Cured)',
      description: 'Fresh green olives from Fes region, hand-picked and naturally cured. Firm texture with a tangy, slightly bitter flavor. Perfect for salads, tagines, and as appetizers.',
      price: 42.00,
      unit: 'kg',
      stockQuantity: 320.0,
    },
    {
      cooperativeId: fesCoop._id,
      name: 'Black Olives (Ripe)',
      description: 'Ripe black olives from Fes olive groves. Rich, fruity flavor with a soft texture. Perfect for Mediterranean dishes, pizzas, and tapenades.',
      price: 38.00,
      unit: 'kg',
      stockQuantity: 280.0,
    },
    {
      cooperativeId: fesCoop._id,
      name: 'Medjool Dates',
      description: 'Premium Medjool dates from Fes region. Large, sweet, and naturally soft with a caramel-like flavor. Rich in fiber, potassium, and natural sugars. Perfect for snacking or desserts.',
      price: 72.00,
      unit: 'kg',
      stockQuantity: 450.0,
    },
    {
      cooperativeId: fesCoop._id,
      name: 'Date Paste',
      description: 'Natural date paste made from premium Medjool dates. No added sugar or preservatives. Perfect for baking, smoothies, and as a natural sweetener.',
      price: 85.00,
      unit: 'kg',
      stockQuantity: 120.0,
    },
    
    // Marrakech Spice Collective - Spices & Herbs
    {
      cooperativeId: marrakechCoop._id,
      name: 'Ras el Hanout (Premium Blend)',
      description: 'Premium Ras el Hanout spice blend from Marrakech souks. A complex mix of 27+ spices including cardamom, cinnamon, cumin, and more. Essential for authentic Moroccan tagines and couscous.',
      price: 125.00,
      unit: '100g',
      stockQuantity: 200.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Cumin Seeds',
      description: 'Premium cumin seeds from Marrakech region. Aromatic and earthy flavor. Essential spice in Moroccan cuisine. Perfect for tagines, soups, and spice blends.',
      price: 45.00,
      unit: '100g',
      stockQuantity: 350.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Coriander Seeds',
      description: 'Fresh coriander seeds from Marrakech. Citrusy and slightly sweet flavor. Essential for Moroccan spice blends and traditional recipes.',
      price: 38.00,
      unit: '100g',
      stockQuantity: 280.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Paprika (Sweet)',
      description: 'Premium sweet paprika from Marrakech. Rich red color and mild, sweet flavor. Perfect for adding color and flavor to tagines, grilled meats, and vegetables.',
      price: 42.00,
      unit: '100g',
      stockQuantity: 240.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Turmeric Powder',
      description: 'Premium turmeric powder from Marrakech. Bright yellow color and earthy flavor. Known for its health benefits. Essential for curry blends and traditional Moroccan dishes.',
      price: 48.00,
      unit: '100g',
      stockQuantity: 195.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Ginger Powder',
      description: 'Premium ginger powder from Marrakech. Warm, spicy flavor with health benefits. Perfect for teas, spice blends, and traditional Moroccan recipes.',
      price: 52.00,
      unit: '100g',
      stockQuantity: 175.0,
    },
    {
      cooperativeId: marrakechCoop._id,
      name: 'Cinnamon Sticks',
      description: 'Premium cinnamon sticks from Marrakech. Sweet and warm flavor. Perfect for teas, tagines, and desserts. High quality Ceylon cinnamon.',
      price: 65.00,
      unit: '100g',
      stockQuantity: 220.0,
    },
    
    // Atlas Honey Cooperative - Honey Products
    {
      cooperativeId: atlasCoop._id,
      name: 'Wildflower Honey',
      description: 'Pure wildflower honey from the Atlas Mountains. Rich, floral flavor with natural crystallization. Collected from diverse mountain flora. Rich in antioxidants and enzymes.',
      price: 165.00,
      unit: 'kg',
      stockQuantity: 88.0,
    },
    {
      cooperativeId: atlasCoop._id,
      name: 'Thyme Honey',
      description: 'Premium thyme honey from Atlas Mountains. Distinctive herbal flavor and aroma. Known for its health benefits. Perfect for tea, breakfast, or as a natural remedy.',
      price: 195.00,
      unit: 'kg',
      stockQuantity: 55.0,
    },
    {
      cooperativeId: atlasCoop._id,
      name: 'Eucalyptus Honey',
      description: 'Pure eucalyptus honey from Atlas region. Distinctive menthol-like flavor. Known for respiratory health benefits. Rich and aromatic.',
      price: 185.00,
      unit: 'kg',
      stockQuantity: 42.0,
    },
    {
      cooperativeId: atlasCoop._id,
      name: 'Royal Jelly',
      description: 'Premium royal jelly from Atlas Mountain beehives. Rich in nutrients and proteins. Known for its health and wellness benefits. Fresh and pure.',
      price: 450.00,
      unit: '100g',
      stockQuantity: 25.0,
    },
    
    // Safi Ceramics Cooperative - Handicrafts
    {
      cooperativeId: safiCoop._id,
      name: 'Traditional Tagine Pot (Large)',
      description: 'Handcrafted traditional Moroccan tagine pot from Safi. Made from natural clay with beautiful glazed finish. Perfect for slow-cooking tagines and stews. Includes decorative lid.',
      price: 285.00,
      unit: 'piece',
      stockQuantity: 45,
    },
    {
      cooperativeId: safiCoop._id,
      name: 'Decorative Ceramic Bowl Set',
      description: 'Hand-painted ceramic bowl set from Safi. Traditional Moroccan patterns and vibrant colors. Set of 4 bowls, perfect for serving traditional dishes.',
      price: 195.00,
      unit: 'set',
      stockQuantity: 38,
    },
    {
      cooperativeId: safiCoop._id,
      name: 'Moroccan Tea Set',
      description: 'Traditional Moroccan tea set with decorative patterns. Includes teapot, 6 glasses, and serving tray. Handcrafted in Safi with authentic designs.',
      price: 320.00,
      unit: 'set',
      stockQuantity: 28,
    },
    {
      cooperativeId: safiCoop._id,
      name: 'Decorative Ceramic Plate',
      description: 'Large hand-painted decorative ceramic plate from Safi. Traditional zellij-inspired patterns. Perfect for wall decoration or serving.',
      price: 145.00,
      unit: 'piece',
      stockQuantity: 52,
    },
  ];

  const createdProducts = [];

  for (const productData of products) {
    try {
      const product = await Product.create(productData);
      
      createdProducts.push(product);
      log(`  ✓ Created product: ${product.name} (${product.price} MAD/${product.unit})`);
    } catch (error) {
      logError(`Error creating product ${productData.name}`, error);
      throw error;
    }
  }

  log(`Created ${createdProducts.length} products`);
  return createdProducts;
};

/**
 * Create sample transactions
 */
const createTransactions = async (users, products) => {
  log('Creating sample transactions...');
  
  const buyers = users.filter(u => u.role === 'BUYER');
  const producers = users.filter(u => u.role === 'PRODUCER');
  
  if (buyers.length === 0 || producers.length === 0) {
    throw new Error('Required users not found');
  }

  // Get various products
  const arganOil = products.find(p => p.name.includes('Premium Organic Argan Oil'));
  const cosmeticArgan = products.find(p => p.name.includes('Cosmetic Argan Oil'));
  const saffron = products.find(p => p.name.includes('Premium Saffron Threads'));
  const dates = products.find(p => p.name.includes('Medjool Dates'));
  const oliveOil = products.find(p => p.name.includes('Extra Virgin Olive Oil'));
  const almonds = products.find(p => p.name.includes('Organic Almonds'));
  const rasElHanout = products.find(p => p.name.includes('Ras el Hanout'));
  const wildflowerHoney = products.find(p => p.name.includes('Wildflower Honey'));
  const taginePot = products.find(p => p.name.includes('Traditional Tagine Pot'));
  const teaSet = products.find(p => p.name.includes('Moroccan Tea Set'));

  if (!arganOil || !saffron || !dates || !oliveOil) {
    throw new Error('Required products not found');
  }

  // Calculate timestamps for past 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Helper to get random buyer
  const getRandomBuyer = () => buyers[Math.floor(Math.random() * buyers.length)];
  
  // Build transactions array with proper seller assignment
  const transactionTemplates = [
    // SETTLED transactions (completed)
    {
      product: arganOil,
      quantity: 2,
      amount: 760.00,
      fee: 15.20,
      totalAmount: 775.20,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-001',
      daysAgo: 25,
      settledDaysAgo: 22,
    },
    {
      product: saffron,
      quantity: 1,
      amount: 920.00,
      fee: 18.40,
      totalAmount: 938.40,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-002',
      daysAgo: 22,
      settledDaysAgo: 18,
    },
    {
      product: dates,
      quantity: 3,
      amount: 216.00,
      fee: 4.32,
      totalAmount: 220.32,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-003',
      daysAgo: 20,
      settledDaysAgo: 16,
    },
    {
      product: oliveOil,
      quantity: 2,
      amount: 220.00,
      fee: 4.40,
      totalAmount: 224.40,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-004',
      daysAgo: 18,
      settledDaysAgo: 14,
    },
    {
      product: almonds,
      quantity: 2,
      amount: 210.00,
      fee: 4.20,
      totalAmount: 214.20,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-005',
      daysAgo: 15,
      settledDaysAgo: 11,
    },
    {
      product: rasElHanout,
      quantity: 2,
      amount: 250.00,
      fee: 5.00,
      totalAmount: 255.00,
      status: 'SETTLED',
      escrowTransactionId: 'tx-settled-006',
      daysAgo: 12,
      settledDaysAgo: 8,
    },
    
    // DELIVERED transactions (awaiting confirmation)
    {
      product: wildflowerHoney || arganOil,
      quantity: 1,
      amount: 165.00,
      fee: 3.30,
      totalAmount: 168.30,
      status: 'DELIVERED',
      escrowTransactionId: 'tx-delivered-001',
      daysAgo: 10,
    },
    {
      product: cosmeticArgan || arganOil,
      quantity: 1,
      amount: 320.00,
      fee: 6.40,
      totalAmount: 326.40,
      status: 'DELIVERED',
      escrowTransactionId: 'tx-delivered-002',
      daysAgo: 8,
    },
    
    // SHIPPED transactions
    {
      product: taginePot || arganOil,
      quantity: 1,
      amount: 285.00,
      fee: 5.70,
      totalAmount: 290.70,
      status: 'SHIPPED',
      escrowTransactionId: 'tx-shipped-001',
      daysAgo: 6,
    },
    {
      product: teaSet || arganOil,
      quantity: 1,
      amount: 320.00,
      fee: 6.40,
      totalAmount: 326.40,
      status: 'SHIPPED',
      escrowTransactionId: 'tx-shipped-002',
      daysAgo: 5,
    },
    {
      product: saffron,
      quantity: 2,
      amount: 1840.00,
      fee: 36.80,
      totalAmount: 1876.80,
      status: 'SHIPPED',
      escrowTransactionId: 'tx-shipped-003',
      daysAgo: 4,
    },
    
    // ESCROWED transactions (pending)
    {
      product: dates,
      quantity: 2,
      amount: 144.00,
      fee: 2.88,
      totalAmount: 146.88,
      status: 'ESCROWED',
      escrowTransactionId: 'tx-escrowed-001',
      daysAgo: 3,
    },
    {
      product: oliveOil,
      quantity: 3,
      amount: 330.00,
      fee: 6.60,
      totalAmount: 336.60,
      status: 'ESCROWED',
      escrowTransactionId: 'tx-escrowed-002',
      daysAgo: 2,
    },
    {
      product: almonds,
      quantity: 1,
      amount: 105.00,
      fee: 2.10,
      totalAmount: 107.10,
      status: 'ESCROWED',
      escrowTransactionId: 'tx-escrowed-003',
      daysAgo: 1,
    },
  ];

  // Build transactions with proper seller assignment
  const transactions = [];
  for (const template of transactionTemplates) {
    if (!template.product) continue;
    
    // Get seller from product's cooperative
    const product = await Product.findById(template.product._id).populate({
      path: 'cooperativeId',
      select: 'userId',
      model: 'Cooperative',
    });
    
    if (!product || !product.cooperativeId) {
      log(`  ⚠️  Skipping transaction - product or cooperative not found for ${template.product.name}`);
      continue;
    }
    
    // userId might be an ObjectId or already populated
    const userId = product.cooperativeId.userId?._id 
      ? product.cooperativeId.userId._id.toString()
      : product.cooperativeId.userId?.toString() 
      ? product.cooperativeId.userId.toString()
      : product.cooperativeId.userId;
    
    const seller = users.find(u => u._id.toString() === userId?.toString());
    
    if (!seller) {
      log(`  ⚠️  Skipping transaction - seller not found for product ${template.product.name}`);
      continue;
    }
    
    const createdAt = new Date(now.getTime() - template.daysAgo * 24 * 60 * 60 * 1000);
    const settledAt = template.settledDaysAgo 
      ? new Date(now.getTime() - template.settledDaysAgo * 24 * 60 * 60 * 1000)
      : null;
    
    transactions.push({
      buyerId: getRandomBuyer()._id,
      sellerId: seller._id,
      productId: template.product._id,
      quantity: template.quantity,
      amount: template.amount,
      fee: template.fee,
      totalAmount: template.totalAmount,
      status: template.status,
      escrowTransactionId: template.escrowTransactionId,
      createdAt,
      settledAt,
    });
  }

  const createdTransactions = [];

  for (const txData of transactions) {
    try {
      const transaction = await Transaction.create(txData);
      createdTransactions.push(transaction);
      
      // Create transaction logs based on status
      const logMessages = {
        INITIATED: 'Transaction created and initiated',
        ESCROWED: 'Funds escrowed successfully',
        SHIPPED: 'Product shipped by seller',
        DELIVERED: 'Product marked as delivered',
        SETTLED: 'Payment released to seller',
        FAILED: 'Transaction failed',
      };
      
      await TransactionLog.create({
        transactionId: transaction._id,
        status: transaction.status,
        message: logMessages[transaction.status] || `Transaction ${transaction.status.toLowerCase()}`,
        apiResponse: { escrowTransactionId: txData.escrowTransactionId },
      });
      
      // Add additional logs for settled transactions
      if (transaction.status === 'SETTLED' && transaction.settledAt) {
        await TransactionLog.create({
          transactionId: transaction._id,
          status: 'SETTLED',
          message: 'Funds released to seller',
          apiResponse: { settledAt: transaction.settledAt },
        });
      }
      
      log(`  ✓ Created transaction: ${transaction._id.toString().substring(0, 8)}... (${transaction.status}, ${transaction.totalAmount.toFixed(2)} MAD)`);
    } catch (error) {
      logError(`Error creating transaction`, error);
      throw error;
    }
  }

  log(`Created ${createdTransactions.length} transactions`);
  return createdTransactions;
};

/**
 * Main seeding function
 */
const seed = async () => {
  log('Starting database seeding...');
  log('='.repeat(50));

  try {
    // Test connection first
    log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Cannot connect to MongoDB database!');
    }
    log('✓ Database connection successful');
    log('');

    // Clear existing data
    await clearData();
    log('');

    // Create users
    const users = await createUsers();
    log('');

    // Create cooperatives
    const cooperatives = await createCooperatives(users);
    log('');

    // Create products
    const products = await createProducts(cooperatives);
    log('');

    // Create transactions
    const transactions = await createTransactions(users, products);
    log('');

    log('='.repeat(50));
    log('Database seeding completed successfully!');
    log('');
    log('Summary:');
    log(`  - Users: ${users.length}`);
    log(`  - Cooperatives: ${cooperatives.length}`);
    log(`  - Products: ${products.length}`);
    log(`  - Transactions: ${transactions.length}`);
    log('');
    log('Test credentials:');
    log('  Buyers:');
    log('    Email: buyer1@test.com | Password: TestPass123!');
    log('    Email: buyer2@test.com | Password: TestPass123!');
    log('    Email: buyer3@test.com | Password: TestPass123!');
    log('  Producers:');
    log('    Email: producer1@test.com | Password: TestPass123!');
    log('    Email: producer2@test.com | Password: TestPass123!');
    log('    Email: producer3@test.com | Password: TestPass123!');
    log('    Email: producer4@test.com | Password: TestPass123!');
    log('  Admin:');
    log('    Email: admin@test.com | Password: TestPass123!');
    log('');

  } catch (error) {
    logError('Seeding failed', error);
    
    // Provide helpful error messages
    if (error.message.includes('connect') || error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
      console.error('\n❌ Cannot connect to MongoDB database!');
      console.error('\n📋 Troubleshooting steps:');
      
      const isCloud = process.env.MONGODB_URI?.includes('mongodb+srv://') || process.env.MONGODB_URI?.includes('mongodb.net');
      
      if (isCloud) {
        console.error('   🔵 Detected MongoDB Atlas (Cloud) connection');
        console.error('   1. Verify your connection string in .env:');
        console.error('      MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sou9na?retryWrites=true&w=majority');
        console.error('   2. Check your MongoDB Atlas dashboard:');
        console.error('      - Ensure your IP address is whitelisted (Network Access)');
        console.error('      - Verify database user credentials are correct');
        console.error('      - Ensure cluster is running (not paused)');
        console.error('   3. URL-encode special characters in password:');
        console.error('      @ → %40, # → %23, $ → %24, etc.');
        console.error('   4. See docs/MONGODB_SETUP.md for detailed setup guide');
      } else {
        console.error('   🟢 Detected local MongoDB connection');
        console.error('   1. Make sure MongoDB is installed:');
        console.error('      sudo pacman -S mongodb');
        console.error('   2. Start MongoDB service:');
        console.error('      sudo systemctl start mongodb');
        console.error('      sudo systemctl enable mongodb');
        console.error('   3. Check your .env file has correct database config:');
        console.error('      MONGODB_URI=mongodb://localhost:27017/sou9na');
        console.error('      OR');
        console.error('      DB_HOST=localhost');
        console.error('      DB_PORT=27017');
        console.error('      DB_NAME=sou9na');
      }
      
      console.error('\n💡 Current connection config:');
      const dbConfig = process.env.MONGODB_URI 
        ? `URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}` // Hide password
        : `Host: ${process.env.DB_HOST || 'localhost'}, Port: ${process.env.DB_PORT || 27017}, Database: ${process.env.DB_NAME || 'sou9na'}`;
      console.error(`   ${dbConfig}\n`);
    }
    
    process.exit(1);
  } finally {
    await disconnectDB();
    log('Database connection closed');
  }
};

// Run seeding if script is executed directly
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('seed.js') ||
                     process.argv[1]?.endsWith('db/seed.js');

if (isMainModule) {
  seed();
}

export default seed;
