#!/usr/bin/env bash
# generate-ngrok-config.sh - Generate ngrok.yml from template
#
# Description:
#   Reads environment variables and generates ngrok.yml from the template.
#   Handles optional fields (domain, basic_auth) by including them only
#   when the relevant environment variables are set.
#
# Architecture:
#   Single-tunnel production mode - Express serves both frontend and API
#   from port 3001. This eliminates CORS issues, allowing basic_auth to work.
#
# Exit Codes:
#   0 - Config generated successfully
#   1 - Template file not found
#
# Usage:
#   ./generate-ngrok-config.sh
#   ./generate-ngrok-config.sh --output /path/to/ngrok.yml
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

print_success() {
    printf "%b[OK]%b %s\n" "${GREEN}" "${NC}" "$1"
}

print_error() {
    printf "%b[ERROR]%b %s\n" "${RED}" "${NC}" "$1" >&2
}

print_info() {
    printf "       %s\n" "$1"
}

# Configuration
TEMPLATE_FILE="${SCRIPT_DIR}/ngrok.yml.template"
OUTPUT_FILE="${SCRIPT_DIR}/ngrok.yml"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Verify template exists
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    print_error "Template file not found: ${TEMPLATE_FILE}"
    exit 1
fi

# Read environment variables with defaults
# Trim any trailing whitespace that may have come from inline comments
shopt -s extglob
NGROK_INSPECTOR_PORT="${NGROK_INSPECTOR_PORT:-4041}"
NGROK_INSPECTOR_PORT="${NGROK_INSPECTOR_PORT%%+([[:space:]])}"
NGROK_DOMAIN="${NGROK_DOMAIN:-}"
NGROK_DOMAIN="${NGROK_DOMAIN%%+([[:space:]])}"
NGROK_AUTH_USER="${NGROK_AUTH_USER:-}"
NGROK_AUTH_USER="${NGROK_AUTH_USER%%+([[:space:]])}"
NGROK_AUTH_PASS="${NGROK_AUTH_PASS:-}"
NGROK_AUTH_PASS="${NGROK_AUTH_PASS%%+([[:space:]])}"
shopt -u extglob

# Build conditional sections for single demo tunnel
# Domain (only if NGROK_DOMAIN is set and valid)
DEMO_DOMAIN=""
if [[ -n "$NGROK_DOMAIN" && "$NGROK_DOMAIN" != *" "* ]]; then
    DEMO_DOMAIN="    domain: ${NGROK_DOMAIN}"
    print_info "Demo domain: ${NGROK_DOMAIN}"
else
    if [[ -n "$NGROK_DOMAIN" ]]; then
        print_info "Skipping invalid NGROK_DOMAIN (contains spaces): '${NGROK_DOMAIN}'"
    fi
fi

# Basic auth section (only if both user and pass are set)
DEMO_BASIC_AUTH=""
if [[ -n "$NGROK_AUTH_USER" && -n "$NGROK_AUTH_PASS" ]]; then
    DEMO_BASIC_AUTH="    basic_auth:\n      - \"${NGROK_AUTH_USER}:${NGROK_AUTH_PASS}\""
    print_info "Basic auth enabled for user: ${NGROK_AUTH_USER}"
else
    print_info "Basic auth disabled (NGROK_AUTH_USER or NGROK_AUTH_PASS not set)"
fi

# Read template and perform substitutions
CONTENT=$(cat "$TEMPLATE_FILE")

# Substitute placeholders
CONTENT="${CONTENT//__NGROK_INSPECTOR_PORT__/$NGROK_INSPECTOR_PORT}"

# Use printf for sections that may contain newlines
# Handle domain
if [[ -n "$DEMO_DOMAIN" ]]; then
    CONTENT="${CONTENT//__DEMO_DOMAIN__/$DEMO_DOMAIN}"
else
    CONTENT="${CONTENT//__DEMO_DOMAIN__/}"
fi

# Handle basic auth with printf to preserve newlines
if [[ -n "$DEMO_BASIC_AUTH" ]]; then
    CONTENT="${CONTENT//__DEMO_BASIC_AUTH__/$(printf '%b' "$DEMO_BASIC_AUTH")}"
else
    CONTENT="${CONTENT//__DEMO_BASIC_AUTH__/}"
fi

# Remove empty lines that may result from empty placeholders
# But preserve the structure
CONTENT=$(echo "$CONTENT" | sed '/^$/N;/^\n$/d')

# Write output file
echo "$CONTENT" > "$OUTPUT_FILE"

print_success "Generated: ${OUTPUT_FILE}"
print_info "Inspector port: ${NGROK_INSPECTOR_PORT}"
print_info "Architecture: Single-tunnel production mode (port 3001)"

exit 0
