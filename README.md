<div align="center">

![PHOTO-2025-11-24-02-35-15](https://github.com/user-attachments/assets/868f140c-395d-41df-97d8-26651a84a061)

![PHOTO-2025-11-24-02-35-15](https://github.com/user-attachments/assets/e06ded17-650a-4da1-9bba-cc482ecc5d94)

![PHOTO-2025-11-24-02-35-15](https://github.com/user-attachments/assets/70ac40e7-99fc-4e28-b7a8-32d7e4ee4a98)

</div>

# F1 2026 Performance Analysis

AI-powered Formula 1 car performance analysis tool with secure serverless architecture.

## 🚀 Features

- **Car Performance Analysis**: Analyze F1 car configurations with AI-powered insights
- **Sensitivity Analysis**: Test how different parameters affect performance
- **Aerodynamic Visualization**: Generate CFD-style flow visualizations
- **Secure API Architecture**: API keys stay server-side, never exposed to users

## 🏗️ Architecture

This application uses **Vercel Serverless Functions** to keep your Google AI API key secure:

- Frontend: React + Vite
- Backend: Vercel Serverless Functions (`/api` directory)
- AI: Google Gemini API (server-side only)

## 📦 Quick Start

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env
   ```

   Get your API key from: https://aistudio.google.com/app/apikey

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Deploy to Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

**Quick steps:**

1. Push your code to GitHub
2. Import project to Vercel
3. Add `GOOGLE_AI_API_KEY` environment variable in Vercel dashboard
4. Deploy!

## 🔒 Security

✅ API key is stored server-side only  
✅ Never exposed to the browser  
✅ Serverless functions handle all AI API calls  
✅ Production-ready and secure

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide with troubleshooting
- [.env.example](.env.example) - Environment variable template

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Google Gemini API
- Vercel Serverless Functions
- Recharts (for data visualization)
