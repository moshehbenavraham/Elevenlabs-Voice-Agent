#!/usr/bin/env bash
# wait-for-tunnels.sh - Poll ngrok API until tunnel is ready
#
# Description:
#   Polls the ngrok local API to check if the demo tunnel is established.
#   Uses exponential backoff for retry timing.
#   Outputs the tunnel URL on success.
#
# Architecture:
#   Single-tunnel production mode - Express serves both frontend and API
#   from port 3001. One tunnel handles everything.
#
# Exit Codes:
#   0 - Tunnel is ready and URL extracted
#   1 - Timeout waiting for tunnel
#   2 - ngrok API not responding
#
# Usage:
#   ./wait-for-tunnels.sh [--timeout SECONDS] [--api-port PORT]
#
# Options:
#   --timeout SECONDS   Maximum wait time (default: 30)
#   --api-port PORT     ngrok API port (default: 4041)
#
# Output:
#   On success, prints tunnel URL to stdout in format:
#     DEMO_URL=https://xxx.ngrok.io
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
TIMEOUT=30
API_PORT=4041
API_URL=""

# Extracted URL (populated by parse_tunnel)
DEMO_URL=""

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --api-port)
                API_PORT="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    API_URL="http://localhost:${API_PORT}/api/tunnels"
}

# Check if jq is available
has_jq() {
    command -v jq >/dev/null 2>&1
}

# Parse tunnel URL from ngrok API response using jq
parse_tunnel_jq() {
    local json="$1"

    # Extract demo URL (port 3001) - try by port first, then by name
    DEMO_URL=$(echo "$json" | jq -r '.tunnels[] | select(.config.addr | test(":3001$")) | .public_url' 2>/dev/null | head -1)

    # Fallback: try by tunnel name
    if [[ -z "$DEMO_URL" || "$DEMO_URL" == "null" ]]; then
        DEMO_URL=$(echo "$json" | jq -r '.tunnels[] | select(.name == "demo") | .public_url' 2>/dev/null | head -1)
    fi
}

# Parse tunnel URL from ngrok API response using grep/sed fallback
parse_tunnel_fallback() {
    local json="$1"

    # Extract URL associated with port 3001
    DEMO_URL=$(echo "$json" | grep -oE '"public_url":"https://[^"]+"|"addr":"[^"]+"' | \
        tr '\n' ' ' | sed 's/"public_url":/\n/g' | grep -E ':3001"' | \
        head -1 | grep -oE 'https://[^"]+' || true)
}

# Parse tunnel (auto-selects jq or fallback)
parse_tunnel() {
    local json="$1"

    if has_jq; then
        parse_tunnel_jq "$json"
    else
        parse_tunnel_fallback "$json"
    fi
}

# Check if tunnel is ready
tunnel_ready() {
    [[ -n "$DEMO_URL" && "$DEMO_URL" != "null" ]]
}

# Poll ngrok API with exponential backoff
poll_tunnel() {
    local start_time
    local elapsed=0
    local delay=1
    local max_delay=8
    local attempt=0
    local response

    start_time=$(date +%s)

    print_info "Waiting for ngrok tunnel..."
    print_info "API endpoint: ${API_URL}"

    while [[ $elapsed -lt $TIMEOUT ]]; do
        attempt=$((attempt + 1))

        # Try to fetch tunnel data
        if response=$(curl -s --max-time 5 "${API_URL}" 2>/dev/null); then
            # Check if we got valid JSON with tunnels
            if echo "$response" | grep -q '"tunnels"'; then
                parse_tunnel "$response"

                if tunnel_ready; then
                    return 0
                fi
            fi
        fi

        # Calculate elapsed time
        elapsed=$(($(date +%s) - start_time))

        # Don't sleep if we're about to timeout
        if [[ $elapsed -lt $TIMEOUT ]]; then
            sleep "$delay"
            # Exponential backoff (1, 2, 4, 8, 8, 8...)
            delay=$((delay * 2))
            if [[ $delay -gt $max_delay ]]; then
                delay=$max_delay
            fi
        fi

        elapsed=$(($(date +%s) - start_time))
    done

    return 1
}

# Main function
main() {
    parse_args "$@"

    # Poll for tunnel
    if poll_tunnel; then
        print_success "Tunnel established"

        # Output URL in parseable format
        echo "DEMO_URL=${DEMO_URL}"
        exit 0
    else
        print_error "Timeout waiting for tunnel (${TIMEOUT}s)"

        # Check if API is responding at all
        if ! curl -s --max-time 2 "${API_URL}" >/dev/null 2>&1; then
            print_error "ngrok API not responding at ${API_URL}"
            exit 2
        fi

        exit 1
    fi
}

# Run main function
main "$@"
