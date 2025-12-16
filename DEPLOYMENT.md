# Deployment Guide for Render

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Mapbox API token (get from https://account.mapbox.com/)

## Deployment Status: ✅ READY

This repository is fully configured and ready to deploy on Render.

## What's Been Configured

### Backend Service
- ✅ Python/Flask API with lightweight dependencies
- ✅ Gunicorn production server (version 22.0.0 - security patched)
- ✅ Health check endpoint configured
- ✅ CORS enabled for frontend communication
- ✅ No security vulnerabilities

### Frontend Service  
- ✅ Next.js 14+ with App Router
- ✅ TypeScript configuration
- ✅ React Map GL for 3D visualization
- ✅ Three.js integration for 3D rendering
- ✅ Build and start commands configured

### Infrastructure
- ✅ `render.yaml` with both services configured
- ✅ Environment variables properly set up
- ✅ Automatic service linking (backend URL → frontend)
- ✅ `.gitignore` configured

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Connect Repository to Render:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select the `Project-Genesis` repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables:**
   - After the blueprint is detected, Render will prompt for environment variables
   - Set `NEXT_PUBLIC_MAPBOX_TOKEN` for the frontend service
     - Get your token from: https://account.mapbox.com/access-tokens/
     - Click "Create a token" if you don't have one
     - Copy the token and paste it into Render

3. **Deploy:**
   - Click "Apply" to create both services
   - Render will automatically:
     - Build the backend (~2-3 minutes)
     - Build the frontend (~3-5 minutes)
     - Link the services together
     - Deploy both applications

4. **Access Your Application:**
   - Backend API: `https://project-genesis-backend.onrender.com`
   - Frontend: `https://project-genesis-frontend.onrender.com`
   - Test backend: `https://project-genesis-backend.onrender.com/api/score?lat=34.754&lon=-78.789`

### Option 2: Manual Service Creation

If you prefer to create services individually:

#### Backend Service:
1. New → Web Service
2. Connect repository
3. Settings:
   - Name: `project-genesis-backend`
   - Environment: `Python 3`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Plan: Free
4. Create Web Service

#### Frontend Service:
1. New → Web Service
2. Connect repository  
3. Settings:
   - Name: `project-genesis-frontend`
   - Environment: `Node`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://project-genesis-backend.onrender.com`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: [your token]
5. Create Web Service

## Post-Deployment Verification

### Check Backend Health:
```bash
curl https://project-genesis-backend.onrender.com/api/score?lat=34.754&lon=-78.789
```

Expected response:
```json
{
  "score": 75.4,
  "classification": "STANDARD PROSPECT",
  "details": {
    "trailers": 150,
    "paved_pct": 85.5,
    "gates": 3
  }
}
```

### Check Frontend:
1. Visit `https://project-genesis-frontend.onrender.com`
2. You should see a satellite map view
3. Check browser console for any errors
4. Verify the Velocity Score appears in the bottom-left corner

## Troubleshooting

### Frontend Shows "OFFLINE MODE"
- **Cause**: Backend URL not properly configured
- **Fix**: Ensure `NEXT_PUBLIC_API_URL` points to your backend service
- **Check**: Environment variables in Render dashboard

### Map Doesn't Load
- **Cause**: Missing or invalid Mapbox token
- **Fix**: Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- **Get token**: https://account.mapbox.com/access-tokens/

### Build Failures
- **Backend**: Check Python version (should be 3.12)
- **Frontend**: Check Node version (should be 18+)
- **Logs**: Review build logs in Render dashboard

### Free Tier Limitations
- Services may sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Consider upgrading for production use

## Cost Estimate
- **Free Tier**: $0/month
  - Backend: Free (750 hours/month)
  - Frontend: Free (750 hours/month)
  - Both services will sleep when inactive

## Local Development

### Backend:
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend:
```bash
cd frontend
npm install
# Create .env.local with:
# NEXT_PUBLIC_MAPBOX_TOKEN=your_token
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# Runs on http://localhost:3000
```

## Security Notes
- ✅ All dependencies scanned for vulnerabilities
- ✅ Gunicorn upgraded to 22.0.0 (patched security issues)
- ✅ CORS properly configured
- ✅ No secrets in repository
- ⚠️ Set secrets as environment variables in Render (never commit)

## Support
For Render-specific issues, see: https://render.com/docs
For application issues, check the repository README.md
