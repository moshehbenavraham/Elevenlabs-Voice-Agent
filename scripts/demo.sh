#!/usr/bin/env bash
# demo.sh - Main orchestration script for ngrok demo mode
#
# Description:
#   Starts and manages all demo mode processes with a single command.
#   Builds frontend, starts Express in production mode, and creates ngrok tunnel.
#   Provides graceful shutdown on Ctrl+C.
#
# Architecture:
#   Single-tunnel production mode - Express serves both frontend (from dist/)
#   and API routes from port 3001. This eliminates CORS issues, allowing
#   basic_auth to work properly.
#
# Exit Codes:
#   0 - Clean shutdown
#   1 - Startup failure
#   2 - ngrok not installed
#   3 - Port conflict
#   4 - Build failure
#
# Usage:
#   ./scripts/demo.sh
#   npm run demo
#
# Environment:
#   NGROK_INSPECTOR_PORT - ngrok API port (default: 4041)
#   NGROK_AUTH_USER - Basic auth username
#   NGROK_AUTH_PASS - Basic auth password
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution (works from any working directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source the shared output formatter library for consistent terminal styling
# shellcheck source=ngrok/output-formatter.sh
source "${SCRIPT_DIR}/ngrok/output-formatter.sh"

# Process tracking
declare -a PIDS=()
declare -a PID_NAMES=()
CLEANUP_IN_PROGRESS=0

# Port configuration - single port for production mode
SERVER_PORT=3001
NGROK_API_PORT="${NGROK_INSPECTOR_PORT:-4041}"

# Extracted URL from ngrok
DEMO_URL=""

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

# Kill process on a specific port
kill_port() {
    local port="$1"
    local pids

    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti :"$port" 2>/dev/null)
        if [[ -n "$pids" ]]; then
            echo "$pids" | xargs kill -9 2>/dev/null || true
            return 0
        fi
    fi
    return 1
}

# Clear required ports by killing any processes using them
clear_ports() {
    print_info "Checking port availability..."

    if check_port "$SERVER_PORT"; then
        print_warning "Port ${SERVER_PORT} in use - killing process..."
        kill_port "$SERVER_PORT"
        sleep 0.5
    fi

    if check_port "$NGROK_API_PORT"; then
        print_warning "Port ${NGROK_API_PORT} in use - killing process..."
        kill_port "$NGROK_API_PORT"
        sleep 0.5
    fi

    # Verify ports are now free
    local still_blocked=0
    if check_port "$SERVER_PORT"; then
        print_error "Failed to free port ${SERVER_PORT}"
        still_blocked=1
    fi
    if check_port "$NGROK_API_PORT"; then
        print_error "Failed to free port ${NGROK_API_PORT}"
        still_blocked=1
    fi

    if [[ $still_blocked -eq 1 ]]; then
        print_error "Could not free all required ports"
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

# Generated config file path
CONFIG_JS_FILE="${PROJECT_ROOT}/dist/config.js"

# Clean up generated config files
cleanup_config_files() {
    print_info "Removing generated config files..."

    if [[ -f "$CONFIG_JS_FILE" ]]; then
        rm -f "$CONFIG_JS_FILE"
        print_success "Removed dist/config.js"
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

# Build the frontend
build_frontend() {
    print_info "Building frontend for production..."

    cd "$PROJECT_ROOT"

    if ! npm run build >/dev/null 2>&1; then
        print_error "Frontend build failed"
        print_info "Run 'npm run build' manually to see errors"
        exit 4
    fi

    # Verify dist directory exists
    if [[ ! -d "${PROJECT_ROOT}/dist" ]]; then
        print_error "Build completed but dist/ directory not found"
        exit 4
    fi

    print_success "Frontend built successfully"
}

# Generate config.js for same-origin API calls
generate_config() {
    print_info "Generating runtime config..."

    # Create config.js with empty apiBaseUrl for same-origin relative paths
    cat > "$CONFIG_JS_FILE" << 'EOF'
/**
 * Runtime Demo Configuration
 * Generated by demo.sh for same-origin production mode
 * API calls use relative paths (same origin = no CORS)
 */
(function() {
  'use strict';
  window.__DEMO_CONFIG__ = {
    apiBaseUrl: '',
    frontendUrl: '',
    isDemoMode: true,
    generatedAt: new Date().toISOString()
  };
})();
EOF

    print_success "Generated dist/config.js"
}

# Start ngrok tunnel
start_ngrok() {
    local start_script="${SCRIPT_DIR}/ngrok/start-tunnels.sh"
    local output

    print_info "Starting ngrok tunnel..."

    if [[ ! -x "$start_script" ]]; then
        print_error "start-tunnels.sh not found or not executable"
        exit 1
    fi

    # Run start-tunnels.sh and capture output
    if ! output=$("$start_script" --timeout 30); then
        print_error "Failed to start ngrok tunnel"
        exit 1
    fi

    # Parse output
    local ngrok_pid
    ngrok_pid=$(echo "$output" | grep '^NGROK_PID=' | cut -d= -f2)
    DEMO_URL=$(echo "$output" | grep '^DEMO_URL=' | cut -d= -f2)

    if [[ -z "$ngrok_pid" ]]; then
        print_error "Could not get ngrok PID"
        exit 1
    fi

    if [[ -z "$DEMO_URL" ]]; then
        print_error "Could not get demo URL"
        exit 1
    fi

    track_pid "$ngrok_pid" "ngrok"
    print_success "ngrok tunnel ready"
}

# Start backend (Express server in production mode)
start_backend() {
    print_info "Starting server in production mode..."

    cd "$PROJECT_ROOT"

    # Start in production mode - serves both API and static frontend
    NODE_ENV=production npm run server >/dev/null 2>&1 &
    local pid=$!

    # Give Express time to start
    sleep 2

    if ! kill -0 "$pid" 2>/dev/null; then
        print_error "Server failed to start"
        cleanup
        exit 1
    fi

    track_pid "$pid" "server"
    print_success "Server started (port ${SERVER_PORT}, production mode)"
}

# Display demo URL using the demo card generator
display_url() {
    local demo_card_script="${SCRIPT_DIR}/ngrok/demo-card.sh"

    if [[ -x "$demo_card_script" ]]; then
        # Use the demo card generator for formatted output
        "$demo_card_script" \
            --demo-url "$DEMO_URL" \
            --local-port "$SERVER_PORT"
    else
        # Fallback to simple display if demo-card.sh not available
        print_header "Demo Mode Active"
        print_divider 40
        echo ""
        echo "  Demo URL: ${DEMO_URL}"
        echo ""
        echo "  Local: http://localhost:${SERVER_PORT}"
        echo ""
        print_divider 40
        echo "  Press Ctrl+C to stop"
        echo ""
    fi
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
    print_info "Architecture: Single-tunnel production mode"
    echo ""

    # Set up signal handlers first
    setup_traps

    # Clear ports and check prerequisites
    clear_ports
    check_ngrok_prereqs
    echo ""

    # Build frontend first (creates dist/)
    build_frontend

    # Start services in order:
    # 1. Start ngrok tunnel (gets public URL)
    start_ngrok

    # 2. Generate config.js for same-origin API calls
    generate_config

    # 3. Start server in production mode (serves dist/ + API)
    start_backend

    # Display URL and wait
    display_url
    wait_for_processes
}

# Run main function
main "$@"
