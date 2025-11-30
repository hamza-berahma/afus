# 🚀 Quick Frontend Deployment Guide

## Option 1: Vercel (Fastest - 2 minutes) ⚡

### Steps:
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository: `hamza-berahma/afus`
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-url.com/api` (or your backend URL)
7. Click "Deploy"

**Done!** Your site will be live in ~2 minutes at `https://afus.vercel.app`

---

## Option 2: Netlify (Alternative - 3 minutes) 🌐

### Steps:
1. Go to https://netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select repository: `hamza-berahma/afus`
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-url.com/api`
7. Click "Deploy site"

**Done!** Your site will be live at `https://random-name.netlify.app`

---

## Option 3: Manual Build & Deploy (5 minutes) 📦

### Build locally:
```bash
cd frontend
npm install
npm run build
```

### Deploy to any static host:
- Upload the `frontend/dist` folder to:
  - GitHub Pages
  - Cloudflare Pages
  - AWS S3 + CloudFront
  - Any static hosting service

---

## Environment Variables Needed:

Make sure to set `VITE_API_BASE_URL` in your deployment platform:
- For local backend: `http://localhost:5000/api`
- For production: `https://api.afus.com/api`

---

## Quick Fix for TypeScript Errors (if build fails):

If you get TypeScript errors, temporarily modify `package.json`:
```json
"build": "vite build"
```
Instead of:
```json
"build": "tsc && vite build"
```

This will skip type checking for faster deployment.

