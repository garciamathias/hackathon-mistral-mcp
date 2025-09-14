#!/bin/bash

echo "🚀 Starting Clash Royale Development Environment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Check if node_modules exist for backend
if [ ! -d "engine/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd engine && npm install && cd ..
fi

# Check if node_modules exist for frontend
if [ ! -d "ui/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd ui && npm install && cd ..
fi

# Start backend server
echo -e "${GREEN}Starting backend server on port 3001...${NC}"
cd engine && npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${GREEN}Starting frontend server on port 3000...${NC}"
cd ui && npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Development environment started!${NC}"
echo ""
echo "🎮 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "📡 WebSocket: ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo -e "${GREEN}================================================${NC}"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID