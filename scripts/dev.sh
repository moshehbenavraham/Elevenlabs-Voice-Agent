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

# Clean up stale demo mode config files to ensure smooth mode switching
# These files override local dev settings if left behind from a demo session

# Reset public/config.js to no-op stub (prevents 404 and removes demo config)
CONFIG_STUB='/* Local development mode - no runtime config override */
/* This file is overwritten by demo mode with actual ngrok URLs */'

if [ -f "public/config.js" ]; then
    # Check if it's a demo config (contains __DEMO_CONFIG__)
    if grep -q "__DEMO_CONFIG__" "public/config.js" 2>/dev/null; then
        echo "$CONFIG_STUB" > "public/config.js"
        echo -e "${YELLOW}Reset public/config.js to local stub${NC}"
    fi
else
    # Create stub if missing
    echo "$CONFIG_STUB" > "public/config.js"
    echo -e "${YELLOW}Created public/config.js stub${NC}"
fi

# Remove other demo files that don't need stubs
DEMO_FILES=(
    "server/.env.demo"
    "scripts/ngrok/ngrok.yml"
)

for file in "${DEMO_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo -e "${YELLOW}Cleaned stale demo file: $file${NC}"
    fi
done

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
