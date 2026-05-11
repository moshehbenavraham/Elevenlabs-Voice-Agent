#!/usr/bin/env bash
#
# dev.sh - Start both API and frontend servers for development
#
# Usage: ./scripts/dev.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
API_PID=""
FRONTEND_PID=""
API_LISTENER_PIDS=""
FRONTEND_LISTENER_PIDS=""

API_PORT="${SERVER_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-8082}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:${API_PORT}/api/health}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT}}"

port_listener_pids() {
    local port="$1"
    lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

is_port_listening() {
    local port="$1"
    ss -ltn "( sport = :$port )" 2>/dev/null | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'
}

stop_pids() {
    local pids="$1"

    if [ -z "$pids" ]; then
        return 0
    fi

    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    sleep 1

    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
}

stop_port_listeners() {
    local port="$1"
    local pids
    pids="$(port_listener_pids "$port" | tr '\n' ' ')"
    stop_pids "$pids"
}

stop_project_compose_service() {
    if ! command -v docker >/dev/null 2>&1; then
        return 0
    fi

    local service_id
    service_id="$(docker compose ps -q voice-agent 2>/dev/null || true)"
    if [ -n "$service_id" ]; then
        echo -e "${YELLOW}Stopping existing Docker Compose voice-agent service on dev ports...${NC}"
        docker compose down --remove-orphans >/dev/null
    fi
}

ensure_port_free() {
    local port="$1"
    local label="$2"

    stop_port_listeners "$port"

    if is_port_listening "$port"; then
        echo -e "${RED}Error: ${label} port ${port} is still in use${NC}"
        echo -e "${YELLOW}Stop the process or container using port ${port}, then rerun npm run dev:start.${NC}"
        exit 1
    fi
}

wait_for_url() {
    local url="$1"
    local label="$2"
    local timeout_seconds="$3"
    local start_time
    start_time="$(date +%s)"

    while [ "$(($(date +%s) - start_time))" -lt "$timeout_seconds" ]; do
        if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
            return 0
        fi

        sleep 1
    done

    echo -e "${RED}${label} did not become ready within ${timeout_seconds}s${NC}"
    return 1
}

# Cleanup function to kill both servers
cleanup() {
    local exit_code=$?

    trap - SIGINT SIGTERM EXIT

    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ -n "$API_PID" ] || [ -n "$API_LISTENER_PIDS" ]; then
        stop_pids "$API_PID $API_LISTENER_PIDS"
        echo -e "${GREEN}API server stopped${NC}"
    fi

    if [ -n "$FRONTEND_PID" ] || [ -n "$FRONTEND_LISTENER_PIDS" ]; then
        stop_pids "$FRONTEND_PID $FRONTEND_LISTENER_PIDS"
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi

    stop_port_listeners "$API_PORT"
    stop_port_listeners "$FRONTEND_PORT"

    echo -e "${GREEN}All servers stopped. Goodbye!${NC}"
    exit "$exit_code"
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

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
stop_project_compose_service
ensure_port_free "$API_PORT" "API"
ensure_port_free "$FRONTEND_PORT" "Frontend"
sleep 1

# Start API server
echo -e "${BLUE}Starting API server...${NC}"
node server/index.js &
API_PID=$!

# Wait for API server to be ready
if ! wait_for_url "$API_HEALTH_URL" "API server" 20; then
    echo -e "${RED}API server failed to start${NC}"
    exit 1
fi
API_LISTENER_PIDS="$(port_listener_pids "$API_PORT" | tr '\n' ' ')"

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
if ! wait_for_url "$FRONTEND_URL" "Frontend server" 30; then
    echo -e "${RED}Frontend server failed to start${NC}"
    exit 1
fi
FRONTEND_LISTENER_PIDS="$(port_listener_pids "$FRONTEND_PORT" | tr '\n' ' ')"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Servers are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:${FRONTEND_PORT}"
echo -e "  ${BLUE}API:${NC}       http://localhost:${API_PORT}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""

# Wait for both processes
wait $API_PID $FRONTEND_PID
