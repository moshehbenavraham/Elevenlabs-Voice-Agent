#!/usr/bin/env bash
# detect-ngrok.sh - Detect ngrok CLI installation
#
# Description:
#   Checks if ngrok is installed and available in PATH.
#   Outputs version information on success.
#
# Exit Codes:
#   0 - ngrok is installed and working
#   1 - ngrok is not found or not working
#
# Usage:
#   ./detect-ngrok.sh
#   if ./detect-ngrok.sh; then echo "ngrok ready"; fi
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

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

# Main detection logic
main() {
    # Check if ngrok command exists using POSIX-compliant command -v
    if ! command -v ngrok >/dev/null 2>&1; then
        print_error "ngrok CLI not found in PATH"
        echo ""
        echo "To install ngrok, run:"
        echo "  ./scripts/ngrok/install-instructions.sh"
        exit 1
    fi

    # Get ngrok location
    local ngrok_path
    ngrok_path=$(command -v ngrok)

    # Get ngrok version
    local ngrok_version
    if ! ngrok_version=$(ngrok version 2>&1); then
        print_error "ngrok found but version check failed"
        print_warning "Path: ${ngrok_path}"
        exit 1
    fi

    # Extract just the version number (e.g., "3.5.0" from "ngrok version 3.5.0")
    local version_number
    version_number=$(echo "${ngrok_version}" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

    # Success output
    print_success "ngrok detected"
    echo "  Version: ${version_number:-unknown}"
    echo "  Path:    ${ngrok_path}"

    # Check if authenticated (optional warning)
    if ! ngrok config check >/dev/null 2>&1; then
        echo ""
        print_warning "ngrok may not be authenticated"
        echo "  Run: ngrok config add-authtoken YOUR_TOKEN"
        echo "  Get token: https://dashboard.ngrok.com/get-started/your-authtoken"
    fi

    exit 0
}

# Run main function
main "$@"
