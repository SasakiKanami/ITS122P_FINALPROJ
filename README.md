# Wanderlust Bags PH

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   # Windows
   copy .env.example .env
   # or Mac/Linux
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env` (get these from Firebase Console)

3. Install dependencies (for Netlify functions):
   ```bash
   cd wanderlust_main/netlify/functions
   npm install
   cd ../../..
   ```

4. Run the build to generate `firebase-config.js`:
   ```bash
   npm run build
   ```

5. For Netlify deployment, add the same environment variables in Netlify's Environment settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Project Structure

- `wanderlust_main/` - Main website files
- `build.js` - Generates firebase-config.js from .env at build time
- `.env` - Your local environment (gitignored, contains secrets)
- `.env.example` - Environment variable template (safe to commit)

## Getting Credentials

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or select existing one
3. Go to Project Settings (gear icon) → General → Your Apps → SDK setup & configuration
4. Copy the config values into your `.env` file

### Cloudinary
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Copy the Cloud Name, API Key, and API Secret into your `.env` file

## How It Works

The `build.js` script reads `.env` and replaces placeholders in `firebase-config-template.js` to generate `firebase-config.js`. This allows the frontend to use Firebase without hardcoding secrets in the repository.

**Important:** Do NOT commit `.env` or `firebase-config.js` - they contain secrets and are gitignored.