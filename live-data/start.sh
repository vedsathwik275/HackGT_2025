#!/bin/bash

# NextGen Live Football Stats - Startup Script
# Starts both backend API and frontend web server

echo "🏈 Starting NextGen Live Football Stats..."

# Start backend API in background
echo "🚀 Starting backend API server..."
python api_server.py &
API_PID=$!
echo "   Backend API running on http://localhost:5001 (PID: $API_PID)"

# Wait a moment for API to start
sleep 2

# Start frontend web server
echo "🌐 Starting frontend web server..."
cd frontend
python -m http.server 3000 &
FRONTEND_PID=$!
echo "   Frontend web app running on http://localhost:3000 (PID: $FRONTEND_PID)"

# Go back to main directory
cd ..

echo ""
echo "✅ NextGen Live Football Stats is running!"
echo "   🔗 Open http://localhost:3000 in your browser"
echo "   📡 API available at http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down NextGen Live Football Stats..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "   Servers stopped"
    exit 0
}

# Set trap for cleanup on script termination
trap cleanup INT TERM

# Wait for both processes
wait
