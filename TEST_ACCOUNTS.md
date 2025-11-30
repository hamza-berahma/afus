# 🔑 Test Accounts

## Default Password
All test accounts use the password: **`TestPass123!`**

---

## 👑 Admin Account

**Email:** `admin@sou9na.ma`  
**Phone:** `212612000000`  
**Password:** `TestPass123!`  
**Role:** ADMIN

---

## 🏭 Producer Accounts (Sample)

### Producer 1
- **Email:** `aicha.hajji0@sou9na.ma`
- **Phone:** `212617597402`
- **Password:** `TestPass123!`
- **Cooperative:** جمعية كسكس Oriental
- **Region:** Oriental

### Producer 2
- **Email:** `nadia.el idrissi1@sou9na.ma`
- **Phone:** `212672496322`
- **Password:** `TestPass123!`
- **Cooperative:** جمعية Boujdour للزعفران
- **Region:** Laâyoune-Sakia El Hamra

### Producer 3
- **Email:** `imane.touimi2@sou9na.ma`
- **Phone:** `212668432836`
- **Password:** `TestPass123!`
- **Cooperative:** Boujdour Couscous Cooperative
- **Region:** Laâyoune-Sakia El Hamra

### Producer 4
- **Email:** `latifa.hamdaoui3@sou9na.ma`
- **Phone:** `212664850484`
- **Password:** `TestPass123!`
- **Cooperative:** Coopérative Couscous Agadir
- **Region:** Souss-Massa

### Producer 5
- **Email:** `mohammed.cherkaoui4@sou9na.ma`
- **Phone:** `212640208340`
- **Password:** `TestPass123!`
- **Cooperative:** جمعية Meknès للزيت الزيتون
- **Region:** Fès-Meknès

---

## 🛒 Buyer Accounts (Sample)

### Buyer 1
- **Email:** `walid.tazi0@sou9na.ma`
- **Phone:** `212674784984`
- **Password:** `TestPass123!`

### Buyer 2
- **Email:** `aicha.hajji1@sou9na.ma`
- **Phone:** `212651607043`
- **Password:** `TestPass123!`

### Buyer 3
- **Email:** `samira.cherkaoui2@sou9na.ma`
- **Phone:** `212643795811`
- **Password:** `TestPass123!`

### Buyer 4
- **Email:** `sanae.bennani3@sou9na.ma`
- **Phone:** `212665208658`
- **Password:** `TestPass123!`

### Buyer 5
- **Email:** `said.benali4@sou9na.ma`
- **Phone:** `212673071161`
- **Password:** `TestPass123!`

---

## 📊 Total Test Accounts

- **1 Admin** account
- **239 Producer** accounts (each with a cooperative)
- **960 Buyer** accounts

All accounts use the same password: **`TestPass123!`**

---

## 🔍 Finding More Accounts

To find more test accounts, query the database:

```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv('.env')
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.sou9na

# Get all producers
producers = db.users.find({'role': 'PRODUCER'})
for prod in producers:
    print(f"{prod['email']} - {prod['phone']}")
```

---

**Note:** All test accounts are created with realistic Moroccan names and phone numbers.
