# Netlify Deployment Guide

This guide will help you fix the authentication errors and successfully deploy your budget tracking app to Netlify.

## The Problem

You're seeing a `500 Internal Server Error` on `/api/auth/session` because NextAuth.js v5 requires specific environment variables to be configured in your Netlify deployment.

## Solution: Configure Environment Variables in Netlify

### Step 1: Generate an AUTH_SECRET

Run this command in your terminal to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output - you'll need it in the next step.

### Step 2: Set Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your project (vivaranam)
3. Click on **"Site configuration"** → **"Environment variables"**
4. Add the following environment variables:

#### Required Variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `AUTH_SECRET` | (paste the secret from Step 1) | Required for NextAuth v5 |
| `NEXTAUTH_SECRET` | (same value as AUTH_SECRET) | Fallback for compatibility |
| `AUTH_URL` | `https://6902fab2c9421d08d82adb63--vivaranam.netlify.app` | Your Netlify URL |
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/dbname` | Your MongoDB connection string |

#### Optional Variables (for Google OAuth):

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `GOOGLE_CLIENT_ID` | Your Google Client ID | Only if using Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret | Only if using Google sign-in |

### Step 3: Update Google OAuth Redirect URIs (if using Google sign-in)

If you're using Google OAuth, update the authorized redirect URIs in your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   - `https://6902fab2c9421d08d82adb63--vivaranam.netlify.app/api/auth/callback/google`
   - `https://your-production-domain.com/api/auth/callback/google` (if you have a custom domain)

### Step 4: Redeploy Your Site

After adding the environment variables:

1. Go to **Deploys** tab in Netlify
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for the deployment to complete

## Verifying the Fix

Once deployed, check the following:

1. Open your site in the browser
2. Try to sign in - the authentication should now work
3. Check the browser console - the 500 errors should be gone
4. The session endpoint should return a valid response

## Troubleshooting

### Still getting 500 errors?

1. **Check Netlify Function Logs:**
   - Go to **Functions** tab in Netlify
   - Look for error messages in the logs
   - Common issues: Missing env vars, database connection failures

2. **Verify MongoDB Connection:**
   - Ensure your MongoDB IP whitelist includes `0.0.0.0/0` (allow all) for serverless functions
   - Or add Netlify's outbound IP addresses to your whitelist

3. **Check AUTH_SECRET is set:**
   ```bash
   # In Netlify Functions logs, you should NOT see:
   # "secret: undefined"
   ```

4. **Verify AUTH_URL matches your deployment:**
   - The URL must match exactly (including https://)
   - No trailing slash

### Database Connection Issues

If MongoDB connection fails:

1. Go to MongoDB Atlas
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. This is required for serverless functions

### Need More Help?

Check the Netlify function logs:
- Netlify Dashboard → Functions → Click on a function → View logs
- Look for specific error messages about auth or database

## What Changed

The following files were updated to fix the deployment issues:

1. **`src/lib/auth.config.ts`**
   - Added `trustHost: true` for Netlify compatibility
   - Updated to use `AUTH_SECRET` (NextAuth v5 standard)

2. **`src/lib/auth.ts`**
   - Added error handling for database operations
   - Added checks for environment variables
   - Improved logging for debugging

3. **`netlify.toml`** (created)
   - Configured Next.js plugin
   - Set function timeout for database operations

4. **`.env.example`** (created)
   - Template for all required environment variables

## Handling Existing Encrypted Data

If you have existing data in MongoDB that was encrypted with a different key, you have two options:

### Option 1: Automatic Fallback (Implemented)
The app now automatically handles unencrypted data. If it can't decrypt data, it will treat it as plain text. This means:
- Old plain text data will work
- Newly saved data will be encrypted with the current `ENCRYPTION_KEY`

### Option 2: Re-encrypt All Data (Recommended)
To ensure all data is encrypted with the same key:

1. Set your `.env.local` with the **same** `ENCRYPTION_KEY` you set in Netlify:
   ```bash
   ENCRYPTION_KEY=4ab1d9175d591f84fbe69fb06948e36352fdab1d09b47181b1325f9984072564
   ```

2. Run the re-encryption script:
   ```bash
   npm run re-encrypt
   ```

3. This will:
   - Find all data in your database
   - Decrypt plain text or old encrypted data
   - Re-encrypt everything with your current key
   - Show you a summary of what was processed

## Security Notes

- **Never commit `.env` files** to git
- Keep your `AUTH_SECRET` and `ENCRYPTION_KEY` secure
- Rotate secrets periodically
- Use MongoDB user with minimal permissions
- **Important:** Your `ENCRYPTION_KEY` must be the same in local development and production


