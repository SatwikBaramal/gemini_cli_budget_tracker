# Netlify Deployment Guide

Your Budget Tracking App has been successfully migrated from SQLite to MongoDB! 🎉

## ✅ What's Changed

- **Database**: SQLite → MongoDB Atlas
- **Data Migration**: All your existing data has been migrated to MongoDB
- **Deployment Ready**: App is now compatible with serverless platforms like Netlify

## 📋 Deployment Steps

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "Migrated to MongoDB for Netlify deployment"
git push origin main
```

### 2. Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub)
4. Select your repository

### 3. Configure Build Settings

Netlify should auto-detect Next.js. Verify these settings:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20.x (will auto-detect from your project)

### 4. Add Environment Variables

This is **CRITICAL** for your app to work:

1. In Netlify Dashboard → **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add the following:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://satwik:<password>@cluster0.uduh1te.mongodb.net/budget_tracker?retryWrites=true&w=majority&appName=Cluster0` |
| `GITHUB_TOKEN` | `your_github_token_for_ai_chatbot` (if you have one) |

4. Click **"Save"**

### 5. Deploy

Click **"Deploy site"** and wait for the build to complete.

## 🔒 Security Recommendations

### Update MongoDB Password

Your current MongoDB connection string has credentials visible. For production:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to **Database Access**
3. Edit user `satwik` and set a new strong password
4. Update the `MONGODB_URI` in Netlify environment variables

### Recommended Connection String Format

```
mongodb+srv://<username>:<strong-password>@cluster0.uduh1te.mongodb.net/budget_tracker?retryWrites=true&w=majority&appName=Cluster0
```

## 🧪 Testing After Deployment

After deployment, test these features:

- [ ] Load the home page (yearly expenses)
- [ ] Add a yearly expense
- [ ] Delete a yearly expense
- [ ] Navigate to `/monthly` page
- [ ] Add monthly expenses
- [ ] Test fixed expenses
- [ ] Edit monthly income
- [ ] Test AI chatbot (if GitHub token is configured)

## 📊 MongoDB Atlas Free Tier Limits

- **Storage**: 512 MB
- **RAM**: Shared
- **Connections**: 500 concurrent
- **Data Transfer**: Limited but sufficient for personal use

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check that `MONGODB_URI` is correctly set in Netlify
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0) in Network Access

### "Build failed"
- Check build logs in Netlify
- Ensure all dependencies are in `package.json`
- Verify `.env.local` is NOT committed to Git (it's ignored)

### "Functions timeout"
- MongoDB queries might be slow on cold starts
- Consider upgrading MongoDB Atlas to a paid tier for better performance

## 🔄 Local Development

Your local setup is already configured with `.env.local`. To run locally:

```bash
npm run dev
```

Your app will connect to the same MongoDB Atlas database.

## 📝 Notes

- The migration script (`scripts/migrate-to-mongodb.ts`) is only needed once and is excluded from builds
- Your old `budget.db` file has been deleted
- All SQLite dependencies have been removed
- The app now uses Mongoose ODM for MongoDB operations

## 🎯 Next Steps

1. Deploy to Netlify following steps above
2. Update MongoDB password for security
3. Test all functionality
4. Consider setting up a separate MongoDB database for production vs development

---

**Need Help?** Check Netlify's [Next.js deployment guide](https://docs.netlify.com/frameworks/next-js/overview/) for more details.

