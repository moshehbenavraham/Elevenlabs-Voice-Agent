#!/usr/bin/env bash
# demo-card.sh - Generates shareable demo card with URLs and credentials
#
# Description:
#   Creates a copy-paste friendly demo card displaying frontend URL,
#   backend URL, local URLs, and optional basic auth credentials.
#   The output is designed to be shared via Slack, Discord, or email.
#
# Features:
#   - ASCII-only box drawing for clean copy-paste
#   - Color-coded sections (respects NO_COLOR)
#   - Conditional auth credentials display
#   - Quick start instructions
#   - Copy-paste friendly output (no trailing escape codes)
#
# Usage:
#   ./demo-card.sh --frontend-url URL --backend-url URL [options]
#
# Arguments:
#   --frontend-url URL    Public frontend URL (required)
#   --backend-url URL     Public backend URL (required)
#   --frontend-port PORT  Local frontend port (default: 8082)
#   --backend-port PORT   Local backend port (default: 3001)
#   --auth-user USER      Basic auth username (optional)
#   --auth-pass PASS      Basic auth password (optional)
#
# Environment Variables:
#   NGROK_AUTH_USER - Basic auth username (alternative to --auth-user)
#   NGROK_AUTH_PASS - Basic auth password (alternative to --auth-pass)
#   NO_COLOR - Disable color output
#
# Exit Codes:
#   0 - Success
#   1 - Missing required arguments
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the output formatter library
# shellcheck source=output-formatter.sh
source "${SCRIPT_DIR}/output-formatter.sh"

# =============================================================================
# Configuration
# =============================================================================

# Default values
FRONTEND_URL=""
BACKEND_URL=""
FRONTEND_PORT="8082"
BACKEND_PORT="3001"
AUTH_USER="${NGROK_AUTH_USER:-}"
AUTH_PASS="${NGROK_AUTH_PASS:-}"

# Box width for consistent formatting
BOX_WIDTH=64

# =============================================================================
# Argument Parsing
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --frontend-url)
                FRONTEND_URL="$2"
                shift 2
                ;;
            --backend-url)
                BACKEND_URL="$2"
                shift 2
                ;;
            --frontend-port)
                FRONTEND_PORT="$2"
                shift 2
                ;;
            --backend-port)
                BACKEND_PORT="$2"
                shift 2
                ;;
            --auth-user)
                AUTH_USER="$2"
                shift 2
                ;;
            --auth-pass)
                AUTH_PASS="$2"
                shift 2
                ;;
            *)
                print_error "Unknown argument: $1"
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# Validation
# =============================================================================

validate_args() {
    local has_error=0

    if [[ -z "$FRONTEND_URL" ]]; then
        print_error "Missing required argument: --frontend-url"
        has_error=1
    fi

    if [[ -z "$BACKEND_URL" ]]; then
        print_error "Missing required argument: --backend-url"
        has_error=1
    fi

    if [[ $has_error -eq 1 ]]; then
        echo ""
        echo "Usage: $0 --frontend-url URL --backend-url URL [options]"
        exit 1
    fi
}

# =============================================================================
# Demo Card Sections
# =============================================================================

# Print the demo card header section
print_demo_header() {
    print_box_top "$BOX_WIDTH"
    print_box_empty "$BOX_WIDTH"
    print_box_line "$BOX_WIDTH" "  Voice-Agent-PuPuPlatter"
    print_box_line "$BOX_WIDTH" "  Demo Mode Active"
    print_box_empty "$BOX_WIDTH"
}

# Print the public URLs section
print_urls_section() {
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_line "$BOX_WIDTH" "  PUBLIC URLS"
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_empty "$BOX_WIDTH"
    print_box_line "$BOX_WIDTH" "  Frontend: ${FRONTEND_URL}"
    print_box_line "$BOX_WIDTH" "  Backend:  ${BACKEND_URL}"
    print_box_empty "$BOX_WIDTH"
}

# Print the local URLs section
print_local_urls_section() {
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_line "$BOX_WIDTH" "  LOCAL URLS (your machine only)"
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_empty "$BOX_WIDTH"
    print_box_line "$BOX_WIDTH" "  Frontend: http://localhost:${FRONTEND_PORT}"
    print_box_line "$BOX_WIDTH" "  Backend:  http://localhost:${BACKEND_PORT}"
    print_box_empty "$BOX_WIDTH"
}

# Print the auth credentials section (only if auth is configured)
print_auth_section() {
    # Only display if both user and pass are set
    if [[ -n "$AUTH_USER" ]] && [[ -n "$AUTH_PASS" ]]; then
        print_box_line "$BOX_WIDTH" "----------------------------------------"
        print_box_line "$BOX_WIDTH" "  AUTHENTICATION"
        print_box_line "$BOX_WIDTH" "----------------------------------------"
        print_box_empty "$BOX_WIDTH"
        print_box_line "$BOX_WIDTH" "  Username: ${AUTH_USER}"
        print_box_line "$BOX_WIDTH" "  Password: ${AUTH_PASS}"
        print_box_empty "$BOX_WIDTH"
    fi
}

# Print the quick start instructions section
print_quickstart_section() {
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_line "$BOX_WIDTH" "  QUICK START"
    print_box_line "$BOX_WIDTH" "----------------------------------------"
    print_box_empty "$BOX_WIDTH"
    print_box_line "$BOX_WIDTH" "  1. Open the Frontend URL in your browser"
    print_box_line "$BOX_WIDTH" "  2. Click the microphone button to start"
    print_box_line "$BOX_WIDTH" "  3. Speak to interact with the voice agent"
    print_box_empty "$BOX_WIDTH"
    print_box_line "$BOX_WIDTH" "  Press Ctrl+C to stop the demo"
    print_box_empty "$BOX_WIDTH"
    print_box_bottom "$BOX_WIDTH"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    parse_args "$@"
    validate_args

    echo ""
    print_demo_header
    print_urls_section
    print_local_urls_section
    print_auth_section
    print_quickstart_section
    echo ""
}

# Run main function with all arguments
main "$@"
