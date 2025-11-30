#!/bin/bash

echo "🔧 Fixing Expo Go issues..."

# Clear caches
echo "Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared

# Reinstall dependencies
echo "Reinstalling dependencies..."
rm -rf node_modules
npm install

# Clear Metro bundler cache
echo "Clearing Metro bundler cache..."
npx expo start -c --no-dev --minify

echo "✅ Done! Now try: npm start"

