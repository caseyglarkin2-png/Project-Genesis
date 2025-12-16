# Project-Genesis
Project Genesis Hackathon Prototype. Genesis accelerates adoption.

## Deployment on Render

This application is configured for deployment on Render using the `render.yaml` configuration file.

### Services Included:
1. **Backend API** (Python/Flask) - Provides yard velocity scoring API
2. **Frontend** (Next.js/React) - Interactive 3D yard visualization

### Deployment Steps:

1. **Connect to Render:**
   - Push this repository to GitHub
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables:**
   - In Render Dashboard, set the following environment variable for the frontend:
     - `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox API token (get one from https://www.mapbox.com/)
   - The `NEXT_PUBLIC_API_URL` will be automatically configured to point to the backend service

3. **Deploy:**
   - Render will automatically build and deploy both services
   - The backend will be available at: `https://project-genesis-backend.onrender.com`
   - The frontend will be available at: `https://project-genesis-frontend.onrender.com`

### Local Development:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` file in the frontend directory with:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```
