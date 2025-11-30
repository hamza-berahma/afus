#!/usr/bin/env python3
"""
Moroccan Data Seeder
Generates realistic Moroccan data using Faker
- 1000+ users with Moroccan names
- 100+ cooperatives across Morocco
- Products for each cooperative
- Realistic transactions
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
from faker.providers import BaseProvider
import bcrypt
import hashlib

# Initialize Faker with available locales
fake = Faker(['fr_FR', 'en_US'])
fake_en = Faker('en_US')
fake_fr = Faker('fr_FR')

# Moroccan first names (common names)
MOROCCAN_FIRST_NAMES = [
    'Ahmed', 'Mohammed', 'Fatima', 'Aicha', 'Hassan', 'Youssef', 'Sanae', 'Karim',
    'Laila', 'Omar', 'Nadia', 'Rachid', 'Samira', 'Khalid', 'Souad', 'Mehdi',
    'Salma', 'Amine', 'Nour', 'Reda', 'Imane', 'Bilal', 'Houda', 'Anass',
    'Sara', 'Hamza', 'Zineb', 'Yassine', 'Meriem', 'Adil', 'Nabila', 'Tarik',
    'Hafsa', 'Walid', 'Khadija', 'Said', 'Amina', 'Jamal', 'Latifa', 'Nabil',
]

# Moroccan last names
MOROCCAN_LAST_NAMES = [
    'Alaoui', 'Benali', 'Bennani', 'Berrada', 'Chraibi', 'El Fassi', 'El Idrissi',
    'El Malki', 'El Ouazzani', 'Fassi', 'Filali', 'Hajji', 'Hamdaoui', 'Idrissi',
    'Kettani', 'Lahlou', 'Lamrani', 'Mansouri', 'Mekouar', 'Ouazzani', 'Rahali',
    'Saadi', 'Tazi', 'Touimi', 'Zahiri', 'Zouhair', 'Amrani', 'Bouazza', 'Cherkaoui',
    'Dahbi', 'El Amrani', 'El Bakkali', 'El Haddadi', 'El Harrak', 'El Kettani',
    'El Malki', 'El Ouazzani', 'El Yousfi', 'Fadili', 'Fassi', 'Hajji', 'Hamdaoui',
]

# Moroccan regions with coordinates
MOROCCAN_REGIONS = [
    {'name': 'Casablanca-Settat', 'lat': 33.5731, 'lng': -7.5898, 'cities': ['Casablanca', 'Settat', 'Mohammedia', 'El Jadida']},
    {'name': 'Rabat-Salé-Kénitra', 'lat': 34.0209, 'lng': -6.8416, 'cities': ['Rabat', 'Salé', 'Kénitra', 'Témara']},
    {'name': 'Fès-Meknès', 'lat': 34.0331, 'lng': -5.0003, 'cities': ['Fès', 'Meknès', 'Sefrou', 'Ifrane']},
    {'name': 'Marrakech-Safi', 'lat': 31.6295, 'lng': -7.9811, 'cities': ['Marrakech', 'Safi', 'Essaouira', 'El Kelâa']},
    {'name': 'Tanger-Tétouan-Al Hoceïma', 'lat': 35.7595, 'lng': -5.8340, 'cities': ['Tanger', 'Tétouan', 'Al Hoceïma', 'Larache']},
    {'name': 'Oriental', 'lat': 34.6814, 'lng': -1.9076, 'cities': ['Oujda', 'Nador', 'Berkane', 'Taourirt']},
    {'name': 'Béni Mellal-Khénifra', 'lat': 32.3373, 'lng': -6.3498, 'cities': ['Béni Mellal', 'Khénifra', 'Azilal', 'Khouribga']},
    {'name': 'Souss-Massa', 'lat': 30.4278, 'lng': -9.5981, 'cities': ['Agadir', 'Taroudant', 'Tiznit', 'Oulad Teima']},
    {'name': 'Drâa-Tafilalet', 'lat': 31.6295, 'lng': -4.7278, 'cities': ['Errachidia', 'Ouarzazate', 'Zagora', 'Tinghir']},
    {'name': 'Guelmim-Oued Noun', 'lat': 28.9869, 'lng': -10.0528, 'cities': ['Guelmim', 'Sidi Ifni', 'Tan-Tan', 'Assa']},
    {'name': 'Laâyoune-Sakia El Hamra', 'lat': 27.1536, 'lng': -13.2033, 'cities': ['Laâyoune', 'Boujdour', 'Tarfaya', 'Smara']},
    {'name': 'Dakhla-Oued Ed-Dahab', 'lat': 23.6849, 'lng': -15.9582, 'cities': ['Dakhla', 'Aousserd', 'Bir Anzarane']},
]

# Moroccan product categories
PRODUCT_CATEGORIES = {
    'Argan': ['زيت الأركان', 'Argan Oil', 'Huile d\'Argan'],
    'Olive': ['زيت الزيتون', 'Olive Oil', 'Huile d\'Olive'],
    'Honey': ['عسل', 'Honey', 'Miel'],
    'Dates': ['تمر', 'Dates', 'Dattes'],
    'Saffron': ['زعفران', 'Saffron', 'Safran'],
    'Almonds': ['لوز', 'Almonds', 'Amandes'],
    'Spices': ['بهارات', 'Spices', 'Épices'],
    'Couscous': ['كسكس', 'Couscous', 'Couscous'],
    'Tea': ['شاي', 'Tea', 'Thé'],
    'Ceramics': ['فخار', 'Ceramics', 'Céramique'],
    'Wool': ['صوف', 'Wool', 'Laine'],
    'Leather': ['جلد', 'Leather', 'Cuir'],
}

# Cooperative name templates
COOPERATIVE_TEMPLATES = [
    'تعاونية {product} {region}',
    'جمعية {product} {city}',
    'تعاونية {region} لل{product}',
    '{city} {product} Cooperative',
    'Coopérative {product} {city}',
    '{region} {product} Collective',
]

def get_mongodb_uri():
    """Get MongoDB URI from environment"""
    # Try to load from .env file
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    except ImportError:
        pass
    
    uri = os.getenv('MONGODB_URI')
    if not uri:
        # Fallback to local MongoDB
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '27017')
        db_name = os.getenv('DB_NAME', 'sou9na')
        uri = f'mongodb://{host}:{port}/{db_name}'
        print(f'⚠️  MONGODB_URI not found, using fallback: {uri}')
    else:
        # Mask password in URI for logging
        if '@' in uri:
            parts = uri.split('@')
            if len(parts) == 2:
                masked_uri = parts[0].split(':')[0] + ':***@' + parts[1]
                print(f'📡 Using MongoDB URI: {masked_uri}')
    return uri

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_moroccan_phone():
    """Generate realistic Moroccan phone number"""
    prefixes = ['612', '613', '614', '615', '616', '617', '618', '619', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630', '631', '632', '633', '634', '635', '636', '637', '638', '639', '640', '641', '642', '643', '644', '645', '646', '647', '648', '649', '650', '651', '652', '653', '654', '655', '656', '657', '658', '659', '660', '661', '662', '663', '664', '665', '666', '667', '668', '669', '670', '671', '672', '673', '674', '675', '676', '677', '678', '679']
    prefix = random.choice(prefixes)
    number = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return f'212{prefix}{number}'

def generate_cooperative_name(region, city):
    """Generate realistic cooperative name"""
    product_type = random.choice(list(PRODUCT_CATEGORIES.keys()))
    product_ar = PRODUCT_CATEGORIES[product_type][0]
    product_en = PRODUCT_CATEGORIES[product_type][1]
    
    templates = [
        f'تعاونية {product_ar} {city}',
        f'جمعية {product_ar} {region["name"]}',
        f'{city} {product_en} Cooperative',
        f'Coopérative {product_en} {city}',
        f'{region["name"]} {product_en} Collective',
        f'جمعية {city} لل{product_ar}',
    ]
    
    return random.choice(templates)

def generate_product_name(category, cooperative_name):
    """Generate realistic product name"""
    products = {
        'Argan': [
            'زيت الأركان العضوي الممتاز', 'Premium Organic Argan Oil',
            'زيت الأركان للبشرة', 'Cosmetic Argan Oil',
            'حبات الأركان الخام', 'Raw Argan Nuts',
        ],
        'Olive': [
            'زيت الزيتون البكر الممتاز', 'Extra Virgin Olive Oil',
            'زيتون أخضر', 'Green Olives',
            'زيتون أسود', 'Black Olives',
        ],
        'Honey': [
            'عسل الأركان', 'Argan Honey',
            'عسل الزهور البرية', 'Wildflower Honey',
            'عسل الجبل', 'Mountain Honey',
        ],
        'Dates': [
            'تمر المجهول', 'Medjool Dates',
            'تمر العجوة', 'Ajwa Dates',
            'معجون التمر', 'Date Paste',
        ],
        'Saffron': [
            'زعفران خيوط ممتاز', 'Premium Saffron Threads',
            'زعفران مطحون', 'Ground Saffron',
        ],
        'Almonds': [
            'لوز عضوي', 'Organic Almonds',
            'لوز محمص', 'Roasted Almonds',
        ],
        'Spices': [
            'رأس الحانوت', 'Ras el Hanout',
            'كمون', 'Cumin Seeds',
            'كزبرة', 'Coriander Seeds',
        ],
    }
    
    if category in products:
        return random.choice(products[category])
    return f'{category} Product'

def get_product_images(category, product_name):
    """Get realistic product images using reliable image services"""
    # Using Picsum Photos (very reliable) and Unsplash direct URLs
    # Picsum format: https://picsum.photos/seed/{seed}/800/800
    # This ensures we get different images for each product
    
    # Generate a seed based on category and product name for consistency
    seed_base = hash(f"{category}_{product_name}") % 1000
    
    # Use Picsum Photos with category-specific seeds for variety
    # Each category gets different image IDs
    category_seeds = {
        'Argan': [100, 101, 102, 103],
        'Olive': [200, 201, 202, 203],
        'Honey': [300, 301, 302, 303],
        'Dates': [400, 401, 402, 403],
        'Saffron': [500, 501, 502, 503],
        'Almonds': [600, 601, 602, 603],
        'Spices': [700, 701, 702, 703],
        'Couscous': [800, 801, 802, 803],
        'Tea': [900, 901, 902, 903],
        'Ceramics': [1000, 1001, 1002, 1003],
        'Wool': [1100, 1101, 1102, 1103],
        'Leather': [1200, 1201, 1202, 1203],
    }
    
    if category in category_seeds:
        seeds = category_seeds[category]
        # Add product-specific variation
        seeds = [s + (seed_base % 10) for s in seeds]
        image_urls = [f'https://picsum.photos/seed/{s}/800/800' for s in seeds]
    else:
        # Generic images with random seeds
        base_seed = seed_base + 5000
        image_urls = [
            f'https://picsum.photos/seed/{base_seed}/800/800',
            f'https://picsum.photos/seed/{base_seed + 1}/800/800',
            f'https://picsum.photos/seed/{base_seed + 2}/800/800',
            f'https://picsum.photos/seed/{base_seed + 3}/800/800',
        ]
    
    # Select 2-4 random images for variety
    num_images = random.randint(2, 4)
    selected_images = random.sample(image_urls, min(num_images, len(image_urls)))
    
    return selected_images

def clear_database(db):
    """Clear all collections"""
    print('🗑️  Clearing existing data...')
    collections = ['transactionlogs', 'transactions', 'products', 'cooperatives', 'users']
    for collection_name in collections:
        try:
            result = db[collection_name].delete_many({})
            print(f'   ✓ Cleared {collection_name}: {result.deleted_count} documents')
        except Exception as e:
            print(f'   ⚠️  Error clearing {collection_name}: {e}')
    print('✅ Database cleared\n')

def create_users(db, count=1200):
    """Create users with Moroccan names"""
    print(f'👥 Creating {count} users...')
    users = []
    password_hash = hash_password('TestPass123!')
    
    # Create 1 admin
    admin = {
        'email': 'admin@sou9na.ma',
        'phone': '212612000000',
        'passwordHash': password_hash,
        'role': 'ADMIN',
        'createdAt': datetime.now(),
        'updatedAt': datetime.now(),
    }
    users.append(admin)
    
    # Create producers (20% of remaining)
    producer_count = int((count - 1) * 0.2)
    buyer_count = count - 1 - producer_count
    
    used_emails = set()
    used_phones = set()
    
    for i in range(producer_count):
        first_name = random.choice(MOROCCAN_FIRST_NAMES)
        last_name = random.choice(MOROCCAN_LAST_NAMES)
        
        # Ensure unique email
        base_email = f'{first_name.lower()}.{last_name.lower()}'
        email = f'{base_email}{i}@sou9na.ma'
        counter = 0
        while email in used_emails:
            email = f'{base_email}{i}{counter}@sou9na.ma'
            counter += 1
        used_emails.add(email)
        
        # Ensure unique phone
        phone = generate_moroccan_phone()
        while phone in used_phones:
            phone = generate_moroccan_phone()
        used_phones.add(phone)
        
        user = {
            'email': email,
            'phone': phone,
            'passwordHash': password_hash,
            'role': 'PRODUCER',
            'createdAt': fake.date_time_between(start_date='-2y', end_date='now'),
            'updatedAt': datetime.now(),
        }
        users.append(user)
    
    # Create buyers
    for i in range(buyer_count):
        first_name = random.choice(MOROCCAN_FIRST_NAMES)
        last_name = random.choice(MOROCCAN_LAST_NAMES)
        
        # Ensure unique email
        base_email = f'{first_name.lower()}.{last_name.lower()}'
        email = f'{base_email}{i}@sou9na.ma'
        counter = 0
        while email in used_emails:
            email = f'{base_email}{i}{counter}@sou9na.ma'
            counter += 1
        used_emails.add(email)
        
        # Ensure unique phone
        phone = generate_moroccan_phone()
        while phone in used_phones:
            phone = generate_moroccan_phone()
        used_phones.add(phone)
        
        user = {
            'email': email,
            'phone': phone,
            'passwordHash': password_hash,
            'role': 'BUYER',
            'createdAt': fake.date_time_between(start_date='-2y', end_date='now'),
            'updatedAt': datetime.now(),
        }
        users.append(user)
    
    # Insert users in batches
    batch_size = 100
    inserted_users = []
    for i in range(0, len(users), batch_size):
        batch = users[i:i + batch_size]
        result = db.users.insert_many(batch)
        inserted_users.extend([str(id) for id in result.inserted_ids])
        print(f'   ✓ Inserted batch {i//batch_size + 1}/{(len(users)-1)//batch_size + 1}')
    
    print(f'✅ Created {len(users)} users ({producer_count} producers, {buyer_count} buyers, 1 admin)\n')
    return inserted_users

def create_cooperatives(db, user_ids, count=120):
    """Create cooperatives across Morocco"""
    print(f'🏪 Creating {count} cooperatives...')
    
    # Get producer user IDs (as ObjectIds, not strings)
    from bson import ObjectId
    producers = list(db.users.find({'role': 'PRODUCER'}, {'_id': 1}).limit(count))
    producer_ids = [p['_id'] for p in producers]
    
    if len(producer_ids) < count:
        print(f'⚠️  Only {len(producer_ids)} producers available, creating {len(producer_ids)} cooperatives')
        count = len(producer_ids)
    
    cooperatives = []
    used_producers = set()
    
    for i in range(count):
        # Get unused producer
        available_producers = [pid for pid in producer_ids if pid not in used_producers]
        if not available_producers:
            break
        producer_id = random.choice(available_producers)
        used_producers.add(producer_id)
        
        # Select region
        region = random.choice(MOROCCAN_REGIONS)
        city = random.choice(region['cities'])
        
        # Generate cooperative name
        name = generate_cooperative_name(region, city)
        
        # Generate registration number
        reg_prefix = region['name'][:3].upper().replace(' ', '').replace('-', '')
        reg_number = f'REG-{reg_prefix}-{random.randint(2020, 2024)}-{str(i+1).zfill(4)}'
        
        # Generate coordinates (slight variation from region center)
        lat = region['lat'] + random.uniform(-0.5, 0.5)
        lng = region['lng'] + random.uniform(-0.5, 0.5)
        
        # Generate address
        street_types = ['Avenue', 'Rue', 'Boulevard', 'Route', 'Place', 'Quartier']
        street_name = fake_fr.street_name() if random.random() > 0.5 else fake_en.street_name()
        street_type = random.choice(street_types)
        address = f'{street_type} {street_name}, {city}, {region["name"]}, Morocco'
        
        cooperative = {
            'name': name,
            'userId': producer_id,  # Keep as ObjectId
            'registrationNumber': reg_number,
            'region': region['name'],
            'latitude': round(lat, 6),
            'longitude': round(lng, 6),
            'address': address,
            'createdAt': fake.date_time_between(start_date='-2y', end_date='now'),
            'updatedAt': datetime.now(),
        }
        cooperatives.append(cooperative)
    
    # Insert cooperatives
    result = db.cooperatives.insert_many(cooperatives)
    coop_ids = [id for id in result.inserted_ids]  # Keep as ObjectIds
    
    print(f'✅ Created {len(cooperatives)} cooperatives across {len(set(c["region"] for c in cooperatives))} regions\n')
    return coop_ids

def create_products(db, cooperative_ids, products_per_coop=8):
    """Create products for each cooperative"""
    print(f'📦 Creating products ({products_per_coop} per cooperative)...')
    
    from bson import ObjectId
    
    all_products = []
    
    for coop_id in cooperative_ids:
        # Ensure coop_id is ObjectId
        if isinstance(coop_id, str):
            coop_id = ObjectId(coop_id)
        
        coop = db.cooperatives.find_one({'_id': coop_id})
        if not coop:
            print(f'   ⚠️  Cooperative {coop_id} not found, skipping')
            continue
        
        # Determine product category from cooperative name
        category = random.choice(list(PRODUCT_CATEGORIES.keys()))
        for word in coop['name'].split():
            for cat, names in PRODUCT_CATEGORIES.items():
                if any(word.lower() in name.lower() for name in names):
                    category = cat
                    break
        
        # Create products for this cooperative
        for i in range(products_per_coop):
            product_name = generate_product_name(category, coop['name'])
            
            # Generate price (realistic Moroccan prices in MAD)
            if 'Oil' in product_name or 'زيت' in product_name:
                price = round(random.uniform(150, 500), 2)
                unit = 'liter' if 'Oil' in product_name else 'كيلو'
            elif 'Honey' in product_name or 'عسل' in product_name:
                price = round(random.uniform(80, 300), 2)
                unit = 'kg'
            elif 'Dates' in product_name or 'تمر' in product_name:
                price = round(random.uniform(40, 120), 2)
                unit = 'kg'
            elif 'Saffron' in product_name or 'زعفران' in product_name:
                price = round(random.uniform(800, 2000), 2)
                unit = '100g'
            elif 'Almonds' in product_name or 'لوز' in product_name:
                price = round(random.uniform(60, 150), 2)
                unit = 'kg'
            elif 'Spices' in product_name or 'بهارات' in product_name:
                price = round(random.uniform(30, 150), 2)
                unit = '100g'
            else:
                price = round(random.uniform(50, 300), 2)
                unit = random.choice(['kg', 'piece', 'set', '100g'])
            
            stock = random.randint(10, 500)
            
            description = f'Premium quality {product_name} from {coop["region"]}. Sustainably sourced and certified organic.'
            
            # Generate realistic product images
            image_urls = get_product_images(category, product_name)
            primary_image = image_urls[0] if image_urls else None
            
            product = {
                'cooperativeId': coop_id if isinstance(coop_id, ObjectId) else ObjectId(coop_id),
                'name': product_name,
                'description': description,
                'price': price,
                'unit': unit,
                'stockQuantity': stock,
                'imageUrl': primary_image,  # First image for backward compatibility
                'imageUrls': image_urls,  # Array of all images (Amazon-style)
                'deletedAt': None,
                'createdAt': fake.date_time_between(start_date='-1y', end_date='now'),
                'updatedAt': datetime.now(),
            }
            all_products.append(product)
    
    # Insert products in batches
    batch_size = 200
    inserted_products = []
    for i in range(0, len(all_products), batch_size):
        batch = all_products[i:i + batch_size]
        result = db.products.insert_many(batch)
        inserted_products.extend([str(id) for id in result.inserted_ids])
        print(f'   ✓ Inserted batch {i//batch_size + 1}/{(len(all_products)-1)//batch_size + 1}')
    
    print(f'✅ Created {len(all_products)} products\n')
    return inserted_products

def create_transactions(db, transaction_count=2000):
    """Create realistic transactions with various statuses"""
    print(f'💳 Creating {transaction_count} transactions...')
    
    from bson import ObjectId
    
    # Get buyers and products
    buyers = list(db.users.find({'role': 'BUYER'}, {'_id': 1, 'walletId': 1}).limit(500))
    products = list(db.products.find({}, {'_id': 1, 'cooperativeId': 1, 'price': 1, 'stockQuantity': 1}))
    
    if not buyers or not products:
        print('⚠️  No buyers or products found, skipping transaction creation')
        return []
    
    # Get cooperatives to map to sellers
    cooperatives = {str(c['_id']): c['userId'] for c in db.cooperatives.find({}, {'_id': 1, 'userId': 1})}
    
    transactions = []
    transaction_logs = []
    
    # Transaction status distribution (realistic)
    status_weights = {
        'SETTLED': 0.60,      # 60% completed successfully
        'DELIVERED': 0.15,    # 15% delivered but not yet settled
        'SHIPPED': 0.10,      # 10% shipped
        'ESCROWED': 0.10,     # 10% escrowed but not shipped
        'FAILED': 0.05,       # 5% failed
    }
    
    statuses = []
    for status, weight in status_weights.items():
        count = int(transaction_count * weight)
        statuses.extend([status] * count)
    
    # Fill remaining with SETTLED
    while len(statuses) < transaction_count:
        statuses.append('SETTLED')
    
    random.shuffle(statuses)
    
    for i in range(transaction_count):
        # Select random buyer and product
        buyer = random.choice(buyers)
        product = random.choice(products)
        
        # Get seller from cooperative
        coop_id = str(product['cooperativeId'])
        seller_id = cooperatives.get(coop_id)
        
        if not seller_id:
            continue
        
        # Generate realistic quantity (1-5 for most products)
        quantity = random.randint(1, 5)
        if product['price'] < 50:  # Cheaper products, buy more
            quantity = random.randint(2, 10)
        
        # Calculate amounts
        amount = round(product['price'] * quantity, 2)
        fee = round(amount * 0.05, 2)  # 5% platform fee
        total_amount = round(amount + fee, 2)
        
        # Generate transaction date (spread over last 2 years)
        created_at = fake.date_time_between(start_date='-2y', end_date='now')
        
        # Generate escrow transaction ID
        escrow_id = f'ESC{random.randint(100000, 999999)}' if random.random() > 0.1 else None
        
        # Generate QR signature for delivered/settled transactions
        qr_signature = None
        if statuses[i] in ['DELIVERED', 'SETTLED']:
            qr_signature = hashlib.sha256(f'{buyer["_id"]}{product["_id"]}{created_at}'.encode()).hexdigest()[:32]
        
        # Generate settled date for settled transactions
        settled_at = None
        if statuses[i] == 'SETTLED':
            # Settled 1-7 days after creation
            settled_at = created_at + timedelta(days=random.randint(1, 7))
        
        transaction = {
            'buyerId': buyer['_id'] if isinstance(buyer['_id'], ObjectId) else ObjectId(buyer['_id']),
            'sellerId': seller_id if isinstance(seller_id, ObjectId) else ObjectId(seller_id),
            'productId': product['_id'] if isinstance(product['_id'], ObjectId) else ObjectId(product['_id']),
            'quantity': quantity,
            'amount': amount,
            'fee': fee,
            'totalAmount': total_amount,
            'status': statuses[i],
            'escrowTransactionId': escrow_id,
            'qrSignature': qr_signature,
            'settledAt': settled_at,
            'createdAt': created_at,
            'updatedAt': settled_at if settled_at else created_at + timedelta(days=random.randint(0, 3)),
        }
        transactions.append(transaction)
    
    # Insert transactions in batches
    batch_size = 200
    inserted_transactions = []
    for i in range(0, len(transactions), batch_size):
        batch = transactions[i:i + batch_size]
        result = db.transactions.insert_many(batch)
        inserted_transactions.extend([str(id) for id in result.inserted_ids])
        print(f'   ✓ Inserted batch {i//batch_size + 1}/{(len(transactions)-1)//batch_size + 1}')
    
    # Create transaction logs for each transaction
    print('   📝 Creating transaction logs...')
    for tx in transactions:
        # Find the inserted transaction
        tx_doc = db.transactions.find_one({
            'buyerId': tx['buyerId'],
            'productId': tx['productId'],
            'createdAt': tx['createdAt'],
        })
        
        if not tx_doc:
            continue
        
        # Create logs based on status progression
        log_sequence = {
            'INITIATED': {'status': 'INITIATED', 'message': 'Transaction created and initiated'},
            'ESCROWED': {'status': 'ESCROWED', 'message': 'Funds escrowed successfully'},
            'SHIPPED': {'status': 'SHIPPED', 'message': 'Product shipped by seller'},
            'DELIVERED': {'status': 'DELIVERED', 'message': 'Product marked as delivered'},
            'SETTLED': {'status': 'SETTLED', 'message': 'Payment released to seller'},
            'FAILED': {'status': 'FAILED', 'message': 'Transaction failed'},
        }
        
        # Determine which logs to create based on final status
        status_order = ['INITIATED', 'ESCROWED', 'SHIPPED', 'DELIVERED', 'SETTLED']
        final_status = tx['status']
        
        if final_status == 'FAILED':
            logs_to_create = [
                log_sequence['INITIATED'],
                log_sequence['FAILED'],
            ]
        else:
            status_index = status_order.index(final_status) if final_status in status_order else 0
            logs_to_create = [log_sequence[s] for s in status_order[:status_index + 1]]
        
        # Create logs with timestamps
        for idx, log_data in enumerate(logs_to_create):
            log_time = tx['createdAt'] + timedelta(hours=idx * 2)
            log_entry = {
                'transactionId': tx_doc['_id'],
                'status': log_data['status'],
                'message': log_data['message'],
                'apiResponse': {
                    'escrowTransactionId': tx.get('escrowTransactionId'),
                    'qrSignature': tx.get('qrSignature'),
                } if log_data['status'] in ['ESCROWED', 'DELIVERED', 'SETTLED'] else {},
                'createdAt': log_time,
            }
            transaction_logs.append(log_entry)
    
    # Insert transaction logs in batches
    if transaction_logs:
        batch_size = 500
        for i in range(0, len(transaction_logs), batch_size):
            batch = transaction_logs[i:i + batch_size]
            db.transactionlogs.insert_many(batch)
        print(f'   ✓ Created {len(transaction_logs)} transaction logs')
    
    print(f'✅ Created {len(inserted_transactions)} transactions\n')
    return inserted_transactions

def main():
    """Main seeding function"""
    print('🌱 Starting Moroccan Data Seeding...\n')
    
    # Connect to MongoDB
    uri = get_mongodb_uri()
    print(f'📡 Connecting to MongoDB...')
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=30000)
        client.admin.command('ping')
        print('✅ Connected to MongoDB\n')
    except Exception as e:
        print(f'❌ Failed to connect to MongoDB: {e}')
        sys.exit(1)
    
    db = client.sou9na
    
    try:
        # Clear database
        clear_database(db)
        
        # Create users
        user_ids = create_users(db, count=1200)
        
        # Create cooperatives
        cooperative_ids = create_cooperatives(db, user_ids, count=120)
        
        # Create products
        product_ids = create_products(db, cooperative_ids, products_per_coop=8)
        
        # Create transactions
        transaction_ids = create_transactions(db, transaction_count=2000)
        
        print('🎉 Seeding completed successfully!')
        print(f'\n📊 Summary:')
        print(f'   👥 Users: {len(user_ids)}')
        print(f'   🏪 Cooperatives: {len(cooperative_ids)}')
        print(f'   📦 Products: {len(product_ids)}')
        print(f'   💳 Transactions: {len(transaction_ids)}')
        print(f'\n✅ Database is ready with realistic Moroccan data!')
        
    except Exception as e:
        print(f'\n❌ Error during seeding: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()

