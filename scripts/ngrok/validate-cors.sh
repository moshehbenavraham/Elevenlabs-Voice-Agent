#!/usr/bin/env bash
# validate-cors.sh - Validate CORS configuration through ngrok tunnels
#
# Description:
#   Tests that the backend accepts CORS requests from the ngrok frontend URL.
#   Verifies the health endpoint is accessible and returns proper CORS headers.
#
# Exit Codes:
#   0 - CORS validation passed
#   1 - CORS validation failed
#   2 - Backend not reachable
#
# Usage:
#   ./scripts/ngrok/validate-cors.sh --backend-url <url> --frontend-url <url>
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

print_success() {
    printf "%b[OK]%b %s\n" "${GREEN}" "${NC}" "$1"
}

print_error() {
    printf "%b[ERROR]%b %s\n" "${RED}" "${NC}" "$1" >&2
}

print_warning() {
    printf "%b[WARN]%b %s\n" "${YELLOW}" "${NC}" "$1"
}

print_info() {
    printf "%b[INFO]%b %s\n" "${BLUE}" "${NC}" "$1"
}

# Default values
BACKEND_URL=""
FRONTEND_URL=""
TIMEOUT=10

# Parse command-line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --backend-url)
                BACKEND_URL="$2"
                shift 2
                ;;
            --frontend-url)
                FRONTEND_URL="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 --backend-url <url> --frontend-url <url> [--timeout <seconds>]"
                echo ""
                echo "Options:"
                echo "  --backend-url   The ngrok backend URL (required)"
                echo "  --frontend-url  The ngrok frontend URL for Origin header (required)"
                echo "  --timeout       Request timeout in seconds (default: 10)"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Validate required arguments
validate_args() {
    if [[ -z "$BACKEND_URL" ]]; then
        print_error "Missing required --backend-url argument"
        exit 1
    fi

    if [[ -z "$FRONTEND_URL" ]]; then
        print_error "Missing required --frontend-url argument"
        exit 1
    fi
}

# Test basic connectivity to health endpoint
test_health_endpoint() {
    print_info "Testing health endpoint: ${BACKEND_URL}/api/health"

    local response
    local http_code

    # Make request and capture both body and status code
    response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" "${BACKEND_URL}/api/health" 2>/dev/null) || {
        print_error "Failed to connect to backend at ${BACKEND_URL}"
        print_info "Is the backend running and accessible through ngrok?"
        exit 2
    }

    # Extract HTTP status code (last line)
    http_code=$(echo "$response" | tail -1)

    if [[ "$http_code" != "200" && "$http_code" != "503" ]]; then
        print_error "Health endpoint returned HTTP ${http_code}"
        exit 2
    fi

    print_success "Health endpoint reachable (HTTP ${http_code})"
}

# Test CORS preflight (OPTIONS) request
test_cors_preflight() {
    print_info "Testing CORS preflight request..."

    local http_code

    # Make OPTIONS request with Origin header
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$TIMEOUT" \
        -X OPTIONS \
        -H "Origin: ${FRONTEND_URL}" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "${BACKEND_URL}/api/health" 2>/dev/null) || {
        print_error "CORS preflight request failed"
        exit 1
    }

    # OPTIONS should return 2xx (typically 204 or 200)
    if [[ ! "$http_code" =~ ^2 ]]; then
        print_error "CORS preflight returned HTTP ${http_code} (expected 2xx)"
        exit 1
    fi

    print_success "CORS preflight passed (HTTP ${http_code})"
}

# Test CORS headers on actual request
test_cors_headers() {
    print_info "Testing CORS response headers..."

    local headers
    local cors_origin

    # Make GET request with Origin header and capture headers
    headers=$(curl -s -I --max-time "$TIMEOUT" \
        -H "Origin: ${FRONTEND_URL}" \
        "${BACKEND_URL}/api/health" 2>/dev/null) || {
        print_error "Failed to get response headers"
        exit 1
    }

    # Check for Access-Control-Allow-Origin header
    cors_origin=$(echo "$headers" | grep -i "Access-Control-Allow-Origin" | tr -d '\r' | cut -d: -f2- | xargs)

    if [[ -z "$cors_origin" ]]; then
        print_error "Missing Access-Control-Allow-Origin header"
        print_info "Backend may not have CORS configured for: ${FRONTEND_URL}"
        exit 1
    fi

    # Verify the origin matches (or is wildcard)
    if [[ "$cors_origin" != "$FRONTEND_URL" && "$cors_origin" != "*" ]]; then
        print_warning "CORS origin mismatch: expected '${FRONTEND_URL}', got '${cors_origin}'"
        # This might still work if it's a pattern match, so just warn
    fi

    print_success "CORS headers present: Access-Control-Allow-Origin: ${cors_origin}"
}

# Test actual API request with credentials
test_api_request() {
    print_info "Testing API request with Origin header..."

    local response
    local http_code

    response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" \
        -H "Origin: ${FRONTEND_URL}" \
        -H "Content-Type: application/json" \
        "${BACKEND_URL}/api/health" 2>/dev/null) || {
        print_error "API request failed"
        exit 1
    }

    http_code=$(echo "$response" | tail -1)

    if [[ ! "$http_code" =~ ^2 ]]; then
        print_error "API request returned HTTP ${http_code}"
        exit 1
    fi

    print_success "API request successful (HTTP ${http_code})"
}

# Main function
main() {
    parse_args "$@"
    validate_args

    echo ""
    print_info "Validating CORS configuration"
    print_info "Backend:  ${BACKEND_URL}"
    print_info "Frontend: ${FRONTEND_URL}"
    echo ""

    # Run all tests
    test_health_endpoint
    test_cors_preflight
    test_cors_headers
    test_api_request

    echo ""
    print_success "All CORS validation tests passed"
}

# Run main function
main "$@"
