# Deployment Guide

This guide will help you deploy your F1 2026 Performance Analysis application to a live website.

## Recommended: Deploy to Vercel (Easiest)

Vercel is the recommended platform for Vite applications - it's free, fast, and handles environment variables securely.

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   - Create a new repository on [GitHub](https://github.com/new)
   - Follow the instructions to push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign up for Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Project**:

   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Environment Variables**:

   - Before deploying, click "Environment Variables"
   - Add: `VITE_API_KEY` with value: `AIzaSyDP0l6K9_4uHzkixwRzsz9rdaJa_d9Sai0`
   - Make sure it's set for Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for the build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Custom Domain (Optional)

- In Vercel dashboard, go to Settings → Domains
- Add your custom domain and follow DNS configuration instructions

---

## Alternative: Deploy to Netlify

### Quick Deploy

1. **Sign up**: Go to [netlify.com](https://netlify.com)
2. **Drag & Drop Deploy**:
   - Build your project locally: `npm run build`
   - Drag the `dist` folder to Netlify's deploy zone
3. **Add Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add `VITE_API_KEY` with your API key
   - Trigger a new deploy

### Git-based Deploy

1. Push your code to GitHub (see Vercel Step 1)
2. In Netlify, click "New site from Git"
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variable `VITE_API_KEY`
6. Deploy

---

## Alternative: Deploy to GitHub Pages

### Setup

1. **Install gh-pages**:

   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `package.json`**:
   Add these scripts:

   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

   Add base URL (replace with your repo name):

   ```json
   "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
   ```

3. **Update `vite.config.ts`**:

   ```typescript
   export default defineConfig({
     base: "/YOUR_REPO_NAME/",
     // ... rest of config
   });
   ```

4. **Deploy**:

   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Your site will be at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

> **Note**: GitHub Pages doesn't support environment variables securely. You'd need to hardcode the API key (not recommended) or use a backend proxy.

---

## Important Security Notes

✅ **DO**: Use Vercel or Netlify's environment variable features
✅ **DO**: Keep `.env` in `.gitignore` (already configured)
❌ **DON'T**: Commit your API key to Git
❌ **DON'T**: Hardcode the API key in your source code

---

## Recommended Choice

**Use Vercel** - It's the easiest, most secure, and best optimized for Vite projects. The entire process takes about 5 minutes!
