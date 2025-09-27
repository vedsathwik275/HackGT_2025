# 🚀 Deployment Guide - NextGen Live Football Stats

## Recommended Platform: Railway

Railway is perfect for this backend because:
- ✅ **Always-on containers** keep your cache alive
- ✅ **No cold starts** - cache stays warm between requests  
- ✅ **Simple deployment** from GitHub
- ✅ **Affordable** at $5/month

## 🛠️ Railway Deployment Steps

### 1. Prepare Your Repository
```bash
# Make sure all deployment files are committed
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Python and use the configs

### 3. Set Environment Variables
In Railway dashboard:
1. Go to your project → Variables tab
2. Add: `GEMINI_API_KEY` = `your_actual_api_key`
3. Railway will auto-set `PORT` variable

### 4. Deploy!
- Railway automatically deploys on git push
- Your API will be available at: `https://your-app-name.railway.app`
- Health check: `https://your-app-name.railway.app/api/health`

## 🔄 Alternative: Render

### Quick Render Deployment
1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Create "Web Service"
4. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python api_server.py`
   - **Environment**: Add `GEMINI_API_KEY`

⚠️ **Note**: Use Render's paid tier ($7/month) to avoid container sleeping

## 📊 Why These Platforms Work

Your backend needs:
- **Persistent memory** for `SmartESPNCacheManager`
- **Always-on containers** for regular ESPN scraping
- **No cold starts** that would reset cache

❌ **Avoid serverless** (Vercel, Lambda) - they kill your cache!

## 🔧 Production Optimizations

### 1. Health Monitoring
Your API includes `/api/health` endpoint for monitoring

### 2. Cache Status
Monitor cache performance via `/api/stats` endpoint

### 3. Error Handling
Built-in error handlers for 404/500 responses

### 4. CORS Configuration
Already configured for frontend communication

## 🚨 Important Notes

1. **Environment Variables**: Never commit real API keys
2. **Cache Persistence**: Your cache is in-memory, so container restarts reset it
3. **Rate Limiting**: ESPN scraping includes delays to be respectful
4. **Scaling**: Single container is sufficient for this use case

## 📱 Frontend Deployment

Deploy your frontend separately:
- **Vercel/Netlify**: Perfect for static frontend
- **Update API URL**: Point to your deployed backend URL

---

**Ready to deploy!** 🚀 Your football stats backend will have persistent caching and real-time data updates.
