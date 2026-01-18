#!/usr/bin/env bash
# start-tunnels.sh - Start ngrok tunnels and extract URLs
#
# Description:
#   Starts ngrok with the project configuration file.
#   Waits for tunnels to be established.
#   Extracts and outputs the public URLs.
#
# Exit Codes:
#   0 - Tunnels started and URLs extracted successfully
#   1 - Failed to start ngrok or extract URLs
#   2 - ngrok not installed or not authenticated
#
# Usage:
#   ./start-tunnels.sh [--config PATH] [--timeout SECONDS]
#
# Options:
#   --config PATH       Path to ngrok.yml (default: scripts/ngrok/ngrok.yml)
#   --timeout SECONDS   Max wait for tunnels (default: 30)
#
# Output:
#   Prints to stdout:
#     NGROK_PID=12345
#     FRONTEND_URL=https://xxx.ngrok.io
#     BACKEND_URL=https://yyy.ngrok.io
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution (works from any working directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2034
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
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
    printf "       %s\n" "$1"
}

# Configuration defaults
NGROK_CONFIG=""
TIMEOUT=30
NGROK_PID=""
API_PORT="${NGROK_INSPECTOR_PORT:-4041}"

# Extracted URLs
FRONTEND_URL=""
BACKEND_URL=""

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --config)
                NGROK_CONFIG="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Default config path if not specified
    if [[ -z "$NGROK_CONFIG" ]]; then
        NGROK_CONFIG="${SCRIPT_DIR}/ngrok.yml"
    fi
}

# Check if ngrok is installed and authenticated
check_ngrok() {
    local detect_script="${SCRIPT_DIR}/detect-ngrok.sh"

    if [[ -x "$detect_script" ]]; then
        if ! "$detect_script" >/dev/null 2>&1; then
            print_error "ngrok check failed"
            "$detect_script"
            exit 2
        fi
    else
        # Fallback if detect-ngrok.sh not available
        if ! command -v ngrok >/dev/null 2>&1; then
            print_error "ngrok CLI not found in PATH"
            exit 2
        fi
    fi
}

# Start ngrok in background and capture PID
start_ngrok() {
    print_info "Starting ngrok tunnels..."
    print_info "Config: ${NGROK_CONFIG}"

    # Verify config file exists
    if [[ ! -f "$NGROK_CONFIG" ]]; then
        print_error "Config file not found: ${NGROK_CONFIG}"
        exit 1
    fi

    # Start ngrok in background
    # Use --all to start all tunnels defined in config
    ngrok start --all --config "$NGROK_CONFIG" >/dev/null 2>&1 &
    NGROK_PID=$!

    # Give ngrok a moment to start
    sleep 1

    # Verify process is running
    if ! kill -0 "$NGROK_PID" 2>/dev/null; then
        print_error "ngrok failed to start"
        exit 1
    fi

    print_success "ngrok started (PID: ${NGROK_PID})"
}

# Extract URLs using wait-for-tunnels.sh
extract_urls() {
    local wait_script="${SCRIPT_DIR}/wait-for-tunnels.sh"
    local output

    if [[ ! -x "$wait_script" ]]; then
        print_error "wait-for-tunnels.sh not found or not executable"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi

    # Run wait-for-tunnels.sh and capture output
    if ! output=$("$wait_script" --timeout "$TIMEOUT" --api-port "$API_PORT"); then
        print_error "Failed to extract tunnel URLs"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi

    # Parse output for URLs
    FRONTEND_URL=$(echo "$output" | grep '^FRONTEND_URL=' | cut -d= -f2)
    BACKEND_URL=$(echo "$output" | grep '^BACKEND_URL=' | cut -d= -f2)

    if [[ -z "$FRONTEND_URL" || -z "$BACKEND_URL" ]]; then
        print_error "Could not extract both tunnel URLs"
        print_info "Frontend: ${FRONTEND_URL:-not found}"
        print_info "Backend: ${BACKEND_URL:-not found}"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi
}

# Main function
main() {
    parse_args "$@"

    # Verify ngrok is available
    check_ngrok

    # Start ngrok
    start_ngrok

    # Wait for tunnels and extract URLs
    extract_urls

    # Output results in parseable format
    echo "NGROK_PID=${NGROK_PID}"
    echo "FRONTEND_URL=${FRONTEND_URL}"
    echo "BACKEND_URL=${BACKEND_URL}"

    exit 0
}

# Run main function
main "$@"
