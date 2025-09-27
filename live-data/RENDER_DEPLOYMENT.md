# 🚀 Deploying NextGen Live Football Stats on Render

This guide will walk you through deploying your live-data application on Render.com.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🏗️ Deployment Architecture

Your application will be deployed as a **single web service** that:
- Serves the Flask API backend on `/api/*` routes
- Serves the static frontend files on all other routes
- Uses environment variables for configuration

## 📁 Files Created for Deployment

### 1. `render.yaml` (Blueprint Configuration)
```yaml
services:
  - type: web
    name: nextgen-football-stats
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python api_server.py
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: FLASK_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /api/health
```

### 2. Updated `api_server.py`
- Added static file serving routes for the frontend
- Uses `PORT` environment variable (automatically set by Render)
- Serves frontend files from the root path and handles SPA routing

### 3. Updated `frontend/assets/js/app.js`
- Changed API base URL to use relative paths: `window.location.origin + '/api'`
- Works in both development and production environments

## 🚀 Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

1. **Push your code to GitHub** (including the new `render.yaml` file)

2. **Create a new Blueprint on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your live-data folder

3. **Configure Environment Variables**:
   - Render will prompt you to set `GEMINI_API_KEY`
   - Enter your Gemini API key from Google AI Studio

4. **Deploy**:
   - Click "Apply" to deploy
   - Render will automatically build and deploy your application

### Option 2: Manual Web Service Creation

1. **Create a new Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure the Service**:
   - **Name**: `nextgen-football-stats`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python api_server.py`
   - **Root Directory**: `live-data` (if your repo has multiple folders)

3. **Set Environment Variables**:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `FLASK_ENV`: `production`

4. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically

## 🔧 Configuration Details

### Environment Variables Required:
- **`GEMINI_API_KEY`**: Your Google Gemini API key (required)
- **`FLASK_ENV`**: Set to `production` (optional, for better performance)
- **`PORT`**: Automatically set by Render to 10000

### Health Check:
- Render will check `/api/health` to ensure your service is running
- The endpoint returns service status and statistics

### Build Process:
1. Render installs Python dependencies from `requirements.txt`
2. Starts the Flask application with `python api_server.py`
3. Flask serves both API routes and static frontend files

## 🌐 Accessing Your Deployed Application

Once deployed, you'll get a URL like: `https://nextgen-football-stats.onrender.com`

- **Frontend**: Access the web app at the root URL
- **API Health**: Check `https://your-app.onrender.com/api/health`
- **API Endpoints**: All API routes are available at `/api/*`

## 🔍 Testing Your Deployment

1. **Health Check**: Visit `/api/health` - should return service status
2. **Frontend**: Visit the root URL - should load the web application
3. **Chat Feature**: Try asking about football stats to test Gemini integration
4. **API Endpoints**: Test all endpoints:
   - `GET /api/health`
   - `POST /api/chat`
   - `GET /api/stats`
   - `POST /api/cache/clear`

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check that `requirements.txt` includes all dependencies
   - Ensure Python version compatibility (app uses Python 3.12)

2. **Service Won't Start**:
   - Verify `GEMINI_API_KEY` is set correctly
   - Check Render logs for specific error messages

3. **Frontend Not Loading**:
   - Ensure `frontend/` directory structure is correct
   - Check that static file routes are working in `api_server.py`

4. **API Errors**:
   - Verify Gemini API key is valid and has quota
   - Check ESPN data scraping isn't being blocked

### Viewing Logs:
- Go to your service dashboard on Render
- Click "Logs" to see real-time application logs
- Look for startup messages and error details

## 🔄 Updates and Redeployment

Render automatically redeploys when you push to your connected GitHub branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Render automatically builds and deploys the new version

## 💰 Pricing Considerations

- **Free Tier**: Render provides free tier with limitations (sleeps after 15 minutes of inactivity)
- **Paid Plans**: For production use, consider paid plans for always-on service
- **Resource Usage**: Monitor your app's resource usage in the Render dashboard

## 🎯 Production Optimizations

For better production performance, consider:

1. **Caching**: The app already includes smart caching for ESPN data
2. **Error Handling**: Comprehensive error handling is already implemented
3. **Health Monitoring**: Use the `/api/health` endpoint for monitoring
4. **Environment Variables**: All sensitive data uses environment variables

---

Your NextGen Live Football Stats application is now ready for production deployment on Render! 🏈✨
