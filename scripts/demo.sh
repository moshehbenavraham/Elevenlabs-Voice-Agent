#!/usr/bin/env bash
# demo.sh - Main orchestration script for ngrok demo mode
#
# Description:
#   Starts and manages all demo mode processes with a single command.
#   Handles ngrok tunnels, frontend (Vite), and backend (Express).
#   Provides graceful shutdown on Ctrl+C.
#
# Exit Codes:
#   0 - Clean shutdown
#   1 - Startup failure
#   2 - ngrok not installed
#   3 - Port conflict
#
# Usage:
#   ./scripts/demo.sh
#   npm run demo
#
# Environment:
#   NGROK_INSPECTOR_PORT - ngrok API port (default: 4041)
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution (works from any working directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Function to print success message
print_success() {
    printf "%b[OK]%b %s\n" "${GREEN}" "${NC}" "$1"
}

# Function to print error message
print_error() {
    printf "%b[ERROR]%b %s\n" "${RED}" "${NC}" "$1" >&2
}

# Function to print warning message
print_warning() {
    printf "%b[WARN]%b %s\n" "${YELLOW}" "${NC}" "$1"
}

# Function to print info message
print_info() {
    printf "%b[INFO]%b %s\n" "${BLUE}" "${NC}" "$1"
}

# Process tracking
declare -a PIDS=()
declare -a PID_NAMES=()
CLEANUP_IN_PROGRESS=0

# Port configuration
FRONTEND_PORT=8082
BACKEND_PORT=3001
NGROK_API_PORT="${NGROK_INSPECTOR_PORT:-4041}"

# Extracted URLs from ngrok
FRONTEND_URL=""
BACKEND_URL=""

# Check if a port is in use
check_port() {
    local port="$1"

    # Try lsof first (most reliable)
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :"$port" >/dev/null 2>&1; then
            return 0  # Port is in use
        fi
        return 1  # Port is free
    fi

    # Fallback to ss
    if command -v ss >/dev/null 2>&1; then
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            return 0  # Port is in use
        fi
        return 1  # Port is free
    fi

    # Fallback to netstat
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            return 0  # Port is in use
        fi
        return 1  # Port is free
    fi

    # Cannot check, assume free
    print_warning "Cannot check port availability (no lsof, ss, or netstat)"
    return 1
}

# Check all required ports for conflicts
check_port_conflicts() {
    local has_conflict=0

    print_info "Checking port availability..."

    if check_port "$FRONTEND_PORT"; then
        print_error "Port ${FRONTEND_PORT} is already in use (frontend)"
        has_conflict=1
    fi

    if check_port "$BACKEND_PORT"; then
        print_error "Port ${BACKEND_PORT} is already in use (backend)"
        has_conflict=1
    fi

    if check_port "$NGROK_API_PORT"; then
        print_error "Port ${NGROK_API_PORT} is already in use (ngrok API)"
        has_conflict=1
    fi

    if [[ $has_conflict -eq 1 ]]; then
        echo ""
        print_error "Please free the conflicting ports and try again"
        print_info "You can find processes using: lsof -i :PORT"
        exit 3
    fi

    print_success "All ports available"
}

# Check ngrok prerequisites
check_ngrok_prereqs() {
    local detect_script="${SCRIPT_DIR}/ngrok/detect-ngrok.sh"

    print_info "Checking ngrok..."

    if [[ -x "$detect_script" ]]; then
        if ! "$detect_script"; then
            exit 2
        fi
    else
        if ! command -v ngrok >/dev/null 2>&1; then
            print_error "ngrok CLI not found"
            print_info "Run: ./scripts/ngrok/install-instructions.sh"
            exit 2
        fi
        print_success "ngrok detected"
    fi
}

# Add a PID to the tracking array
track_pid() {
    local pid="$1"
    local name="$2"
    PIDS+=("$pid")
    PID_NAMES+=("$name")
}

# Generated config file paths
ENV_DEMO_FILE="${PROJECT_ROOT}/server/.env.demo"
CONFIG_JS_FILE="${PROJECT_ROOT}/public/config.js"

# Clean up generated config files
cleanup_config_files() {
    print_info "Removing generated config files..."

    if [[ -f "$ENV_DEMO_FILE" ]]; then
        rm -f "$ENV_DEMO_FILE"
        print_success "Removed server/.env.demo"
    fi

    if [[ -f "$CONFIG_JS_FILE" ]]; then
        rm -f "$CONFIG_JS_FILE"
        print_success "Removed public/config.js"
    fi
}

# Graceful shutdown - kills processes in reverse order (LIFO)
cleanup() {
    # Guard against re-entry
    if [[ $CLEANUP_IN_PROGRESS -eq 1 ]]; then
        return
    fi
    CLEANUP_IN_PROGRESS=1

    echo ""
    print_info "Shutting down demo mode..."

    # Kill processes in reverse order (LIFO)
    local i
    for ((i = ${#PIDS[@]} - 1; i >= 0; i--)); do
        local pid="${PIDS[$i]}"
        local name="${PID_NAMES[$i]}"

        if kill -0 "$pid" 2>/dev/null; then
            print_info "Stopping ${name} (PID: ${pid})..."
            kill "$pid" 2>/dev/null || true

            # Give process time to exit gracefully
            local wait_count=0
            while kill -0 "$pid" 2>/dev/null && [[ $wait_count -lt 10 ]]; do
                sleep 0.5
                wait_count=$((wait_count + 1))
            done

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing ${name}..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done

    # Clean up generated config files
    cleanup_config_files

    print_success "All processes stopped"
    exit 0
}

# Set up signal traps
setup_traps() {
    trap cleanup SIGINT SIGTERM
}

# Start ngrok tunnels
start_ngrok() {
    local start_script="${SCRIPT_DIR}/ngrok/start-tunnels.sh"
    local output

    print_info "Starting ngrok tunnels..."

    if [[ ! -x "$start_script" ]]; then
        print_error "start-tunnels.sh not found or not executable"
        exit 1
    fi

    # Run start-tunnels.sh and capture output
    if ! output=$("$start_script" --timeout 30); then
        print_error "Failed to start ngrok tunnels"
        exit 1
    fi

    # Parse output
    local ngrok_pid
    ngrok_pid=$(echo "$output" | grep '^NGROK_PID=' | cut -d= -f2)
    FRONTEND_URL=$(echo "$output" | grep '^FRONTEND_URL=' | cut -d= -f2)
    BACKEND_URL=$(echo "$output" | grep '^BACKEND_URL=' | cut -d= -f2)

    if [[ -z "$ngrok_pid" ]]; then
        print_error "Could not get ngrok PID"
        exit 1
    fi

    track_pid "$ngrok_pid" "ngrok"
    print_success "ngrok tunnels ready"
}

# Configure URLs - generates runtime config files with ngrok URLs
configure_urls() {
    local configure_script="${SCRIPT_DIR}/ngrok/configure-urls.sh"

    print_info "Configuring runtime URLs..."

    if [[ ! -x "$configure_script" ]]; then
        print_error "configure-urls.sh not found or not executable"
        cleanup
        exit 1
    fi

    # Run configure-urls.sh with the extracted URLs
    if ! "$configure_script" --frontend-url "$FRONTEND_URL" --backend-url "$BACKEND_URL"; then
        print_error "Failed to configure URLs"
        cleanup
        exit 1
    fi

    print_success "Runtime configuration generated"
}

# Validate CORS configuration through ngrok tunnels
validate_cors() {
    local validate_script="${SCRIPT_DIR}/ngrok/validate-cors.sh"

    # Skip if validate script doesn't exist
    if [[ ! -x "$validate_script" ]]; then
        print_warning "validate-cors.sh not found, skipping CORS validation"
        return 0
    fi

    print_info "Validating CORS configuration..."

    if ! "$validate_script" --backend-url "$BACKEND_URL" --frontend-url "$FRONTEND_URL"; then
        print_warning "CORS validation failed - API calls through ngrok may not work"
        # Don't exit, just warn
    else
        print_success "CORS validation passed"
    fi
}

# Start frontend (Vite dev server)
start_frontend() {
    print_info "Starting frontend..."

    cd "$PROJECT_ROOT"
    npm run dev >/dev/null 2>&1 &
    local pid=$!

    # Give Vite time to start
    sleep 2

    if ! kill -0 "$pid" 2>/dev/null; then
        print_error "Frontend failed to start"
        cleanup
        exit 1
    fi

    track_pid "$pid" "frontend"
    print_success "Frontend started (port ${FRONTEND_PORT})"
}

# Start backend (Express server)
start_backend() {
    print_info "Starting backend..."

    cd "$PROJECT_ROOT"
    npm run server >/dev/null 2>&1 &
    local pid=$!

    # Give Express time to start
    sleep 2

    if ! kill -0 "$pid" 2>/dev/null; then
        print_error "Backend failed to start"
        cleanup
        exit 1
    fi

    track_pid "$pid" "backend"
    print_success "Backend started (port ${BACKEND_PORT})"
}

# Display demo URLs
display_urls() {
    echo ""
    echo "========================================"
    echo "  Demo Mode Active"
    echo "========================================"
    echo ""
    echo "  Frontend: ${FRONTEND_URL}"
    echo "  Backend:  ${BACKEND_URL}"
    echo ""
    echo "  Local frontend: http://localhost:${FRONTEND_PORT}"
    echo "  Local backend:  http://localhost:${BACKEND_PORT}"
    echo ""
    echo "========================================"
    echo "  Press Ctrl+C to stop"
    echo "========================================"
    echo ""
}

# Wait for all processes
wait_for_processes() {
    # Wait indefinitely - cleanup handles exit via trap
    while true; do
        # Check if all tracked processes are still running
        local all_running=1
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                all_running=0
                break
            fi
        done

        if [[ $all_running -eq 0 ]]; then
            print_warning "A process exited unexpectedly"
            cleanup
        fi

        sleep 5
    done
}

# Main function
main() {
    print_info "Voice-Agent-PuPuPlatter Demo Mode"
    echo ""

    # Set up signal handlers first
    setup_traps

    # Check prerequisites
    check_port_conflicts
    check_ngrok_prereqs
    echo ""

    # Start services in order:
    # 1. Start ngrok tunnels (gets public URLs)
    start_ngrok

    # 2. Configure URLs (generates .env.demo and config.js)
    #    MUST happen before backend starts so CORS_ORIGIN is set
    #    MUST happen before frontend serves pages so config.js exists
    configure_urls

    # 3. Start backend (loads .env.demo for CORS)
    start_backend

    # 4. Start frontend (serves config.js for API base URL)
    start_frontend

    # 5. Validate CORS (optional, warns if fails)
    validate_cors

    # Display URLs and wait
    display_urls
    wait_for_processes
}

# Run main function
main "$@"
