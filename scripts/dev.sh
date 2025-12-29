#!/usr/bin/env bash
#
# dev.sh - Start both API and frontend servers for development
#
# Usage: ./scripts/dev.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
API_PID=""
FRONTEND_PID=""

# Cleanup function to kill both servers
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
        kill "$API_PID" 2>/dev/null
        echo -e "${GREEN}API server stopped${NC}"
    fi

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi

    # Kill any remaining node processes on our ports
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:8082 2>/dev/null | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}All servers stopped. Goodbye!${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Change to project root
cd "$(dirname "$0")/.."

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Voice AI Development Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and configure your API keys${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Kill any existing processes on our ports
echo -e "${YELLOW}Checking for existing processes...${NC}"
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8082 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start API server
echo -e "${BLUE}Starting API server...${NC}"
node server/index.js &
API_PID=$!

# Wait for API server to be ready
sleep 2
if ! kill -0 "$API_PID" 2>/dev/null; then
    echo -e "${RED}API server failed to start${NC}"
    exit 1
fi

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Servers are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:8082"
echo -e "  ${BLUE}API:${NC}       http://localhost:3001"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""

# Wait for both processes
wait $API_PID $FRONTEND_PID
