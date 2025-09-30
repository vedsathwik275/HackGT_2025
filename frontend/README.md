# NextGen Football Stats - Frontend

A modern React frontend for the NextGen Live Football Stats API, providing real-time NFL and College Football analytics with AI-powered insights.

## Features

- **Live Chat Interface**: Ask questions about live games, player stats, and team performances
- **Defensive Coach AI**: Get expert defensive coaching analysis based on player coordinates
- **Stats Dashboard**: View comprehensive system statistics and cache status
- **Cache Management**: Control the smart caching system for optimal performance
- **Sport Selection**: Filter between NFL, College, or both sports
- **Real-time Updates**: Auto-refresh capabilities for live game tracking

## Tech Stack

- **React 18.2**: Modern React with hooks
- **Axios**: HTTP client for API communication
- **CSS3**: Custom responsive styling with gradients and animations
- **React Scripts**: Create React App tooling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the API URL in `.env` if needed:
```
REACT_APP_API_URL=https://nextgen-live-data-api.onrender.com
```

### Running the Application

Development mode:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

Production build:
```bash
npm run build
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ChatInterface.js       # Live chat with AI
│   │   ├── DefensiveCoach.js      # Defensive analysis tool
│   │   ├── StatsDashboard.js      # System statistics
│   │   └── CacheManager.js        # Cache control
│   ├── services/
│   │   └── apiClient.js           # API communication layer
│   ├── styles/
│   │   ├── App.css
│   │   ├── ChatInterface.css
│   │   ├── DefensiveCoach.css
│   │   ├── StatsDashboard.css
│   │   ├── CacheManager.css
│   │   └── index.css
│   ├── App.js                     # Main app component
│   └── index.js                   # Entry point
├── package.json
└── README.md
```

## API Integration

The frontend connects to the NextGen Live Football Stats API deployed on Render. The API provides:

- `/api/health` - Health check
- `/api/chat` - Chat with AI about live games
- `/api/defensive-coach` - Defensive coaching analysis
- `/api/stats` - System statistics
- `/api/cache/clear` - Clear cache

See the [API Documentation](../API_DOCUMENTATION.md) for full details.

## Features Overview

### 1. Chat Interface
- Real-time conversation with AI about football games
- Sport filtering (NFL, College, or both)
- Example queries to get started
- Conversation history
- Performance statistics

### 2. Defensive Coach
- Upload player coordinate data (JSON format)
- Get AI-powered defensive formation analysis
- Coverage scheme identification
- Strategic coaching recommendations
- Example data loader for testing

### 3. Stats Dashboard
- Live system statistics
- Cache freshness indicators
- Player and team tracking counts
- Auto-refresh capability
- Separate stats for NFL and College

### 4. Cache Manager
- Clear all cached data
- View cache strategy information
- Force fresh data retrieval
- Cache timing configuration

## Customization

### Changing the API URL

Update the `REACT_APP_API_URL` in your `.env` file:

```bash
# Production
REACT_APP_API_URL=https://your-api-url.com

# Local development
REACT_APP_API_URL=http://localhost:5001
```

### Styling

All styles are in the `src/styles/` directory. The app uses:
- CSS custom properties for theming
- Responsive design with media queries
- Gradient backgrounds and animations
- Component-specific stylesheets

### API Client

The API client (`src/services/apiClient.js`) includes:
- Request/response interceptors for logging
- Error handling
- Timeout configuration
- Automatic retries (can be configured)

## Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Netlify

1. Build the app:
```bash
npm run build
```

2. Deploy the `build` folder to Netlify

### Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
```

Build and run:
```bash
docker build -t nextgen-frontend .
docker run -p 3000:3000 nextgen-frontend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://nextgen-live-data-api.onrender.com` |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues

If you see "Unable to connect to the API":
1. Check that the backend is running
2. Verify the `REACT_APP_API_URL` in `.env`
3. Check browser console for CORS errors
4. Ensure the backend allows requests from your domain

### Build Errors

If you encounter build errors:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Support

For issues or questions:
- Check the API Documentation
- Review browser console for errors
- Verify environment configuration
- Check backend API status at `/api/health`

## Acknowledgments

- OpenAI GPT-5-nano for AI analysis
- ESPN for live sports data
- React team for the framework
