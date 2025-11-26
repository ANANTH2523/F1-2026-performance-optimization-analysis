# Deployment Guide

This guide will help you deploy your F1 2026 Performance Analysis application to Vercel with secure API key handling.

## Architecture Overview

This application uses **Vercel Serverless Functions** to keep your Google AI API key secure. The API key is stored server-side and never exposed to the browser.

## Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Initial commit with serverless API"
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

3. **Configure Environment Variables** (CRITICAL):

   - Before deploying, click "Environment Variables"
   - Add variable name: `GOOGLE_AI_API_KEY`
   - Add your Google AI API key as the value
   - Get your API key from: https://aistudio.google.com/app/apikey
   - Make sure it's set for **Production**, **Preview**, and **Development**

4. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for the build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Verify Deployment

1. Visit your deployed site
2. Try analyzing a car configuration
3. Check that the API features work correctly
4. Verify that the API key is NOT visible in browser DevTools → Network tab

### Step 4: Custom Domain (Optional)

- In Vercel dashboard, go to Settings → Domains
- Add your custom domain and follow DNS configuration instructions

---

## How It Works

### Serverless API Routes

The application includes three serverless functions in the `/api` directory:

- `/api/analyze` - Car performance analysis
- `/api/sensitivity` - Sensitivity analysis
- `/api/generate-image` - Aerodynamic flow visualization

These functions run on Vercel's servers and handle all Google AI API calls, keeping your API key secure.

### Security Benefits

✅ **API key is server-side only** - Never exposed to the browser
✅ **Automatic CORS handling** - Configured in `vercel.json`
✅ **No client-side API key** - Frontend makes HTTP requests to your own API routes
✅ **Environment variables** - Managed securely in Vercel dashboard

---

## Updating Your Deployment

### Automatic Deployments

Once connected to GitHub, Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Update features"
git push
```

### Manual Redeployment

In Vercel dashboard:

1. Go to Deployments
2. Click the three dots on any deployment
3. Select "Redeploy"

---

## Troubleshooting

### "API key not configured" Error

**Problem**: The serverless function can't find the API key.

**Solution**:

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Verify `GOOGLE_AI_API_KEY` is set
3. Make sure it's enabled for the correct environment (Production/Preview/Development)
4. Redeploy the project

### API Calls Failing

**Problem**: Network errors or 500 responses.

**Solution**:

1. Check Vercel Function Logs in the dashboard
2. Verify your Google AI API key is valid at https://aistudio.google.com/app/apikey
3. Ensure you have API quota remaining

### Build Failures

**Problem**: Deployment fails during build.

**Solution**:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Try building locally: `npm run build`

---

## Local Development

To test the serverless functions locally:

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Create local `.env` file**:

   ```bash
   echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env
   ```

3. **Run Vercel dev server**:
   ```bash
   vercel dev
   ```

This will run both your Vite frontend and serverless functions locally.

---

## Important Security Notes

✅ **DO**: Use Vercel's environment variable features
✅ **DO**: Keep `.env` in `.gitignore` (already configured)
✅ **DO**: Use serverless functions for API calls
❌ **DON'T**: Commit your API key to Git
❌ **DON'T**: Hardcode the API key in your source code
❌ **DON'T**: Use `VITE_` prefixed environment variables for secrets (they're embedded in client code)

---

## Why This Architecture?

**Previous approach** (client-side API key):

- ❌ API key visible in browser
- ❌ Anyone can extract and misuse your key
- ❌ Security risk

**New approach** (serverless functions):

- ✅ API key stays on the server
- ✅ Users can't access your key
- ✅ Production-ready and secure
- ✅ Same functionality, better security
