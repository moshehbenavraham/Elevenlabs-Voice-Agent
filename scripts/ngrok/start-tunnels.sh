#!/usr/bin/env bash
# start-tunnels.sh - Start ngrok tunnel and extract URL
#
# Description:
#   Starts ngrok with the project configuration file.
#   Waits for tunnel to be established.
#   Extracts and outputs the public URL.
#
# Architecture:
#   Single-tunnel production mode - Express serves both frontend and API
#   from port 3001. One tunnel handles everything, eliminating CORS issues.
#
# Exit Codes:
#   0 - Tunnel started and URL extracted successfully
#   1 - Failed to start ngrok or extract URL
#   2 - ngrok not installed or not authenticated
#
# Usage:
#   ./start-tunnels.sh [--config PATH] [--timeout SECONDS]
#
# Options:
#   --config PATH       Path to ngrok.yml (default: scripts/ngrok/ngrok.yml)
#   --timeout SECONDS   Max wait for tunnel (default: 30)
#
# Output:
#   Prints to stdout:
#     NGROK_PID=12345
#     DEMO_URL=https://xxx.ngrok.io
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Script directory resolution (works from any working directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2034
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Load environment variables from .env file
# This exports NGROK_AUTHTOKEN and other required variables
load_env() {
    local env_file="${PROJECT_ROOT}/.env"
    if [[ -f "$env_file" ]]; then
        # Parse first so a missing parser/read failure cannot silently drop access controls.
        local parsed_env
        parsed_env=$(mktemp)
        if ! (cd "$PROJECT_ROOT" && node --input-type=module - "$env_file" > "$parsed_env" <<'JS'
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
for (const [key, value] of Object.entries(parse(readFileSync(process.argv[2])))) {
    if (/^NGROK_[A-Z0-9_]+$/.test(key)) process.stdout.write(`${key}\0${value}\0`);
}
JS
        ); then
            rm -f "$parsed_env"
            echo "Failed to read ngrok settings; run npm ci and check .env permissions." >&2
            exit 2
        fi
        # Null-delimited fields preserve quoted #/spaces without evaluating shell code.
        while IFS= read -r -d '' key && IFS= read -r -d '' value; do
            if [[ ! -v "$key" ]]; then
                if [[ "$key" != NGROK_AUTH_USER && "$key" != NGROK_AUTH_PASS ]]; then
                    case "${value,,}" in
                        *\<*|*placeholder*|your_*) continue ;;
                    esac
                fi
                export "$key=$value"
            fi
        done < "$parsed_env"
        rm -f "$parsed_env"
    fi
}

# Load env vars immediately
load_env

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

# Extracted URL
DEMO_URL=""

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

# Generate ngrok config from template
generate_config() {
    local generate_script="${SCRIPT_DIR}/generate-ngrok-config.sh"

    if [[ -x "$generate_script" ]]; then
        print_info "Generating ngrok config from template..."
        if ! "$generate_script" --output "$NGROK_CONFIG"; then
            print_error "Failed to generate ngrok config"
            exit 1
        fi
    else
        # Fallback: check if static config exists
        if [[ ! -f "$NGROK_CONFIG" ]]; then
            print_error "Config generator not found and no static config exists"
            print_info "Expected: ${generate_script}"
            exit 1
        fi
        print_warning "Using existing config (generator script not found)"
    fi
}

# Start ngrok in background and capture PID
start_ngrok() {
    print_info "Starting ngrok tunnel..."
    print_info "Config: ${NGROK_CONFIG}"

    # Verify config file exists
    if [[ ! -f "$NGROK_CONFIG" ]]; then
        print_error "Config file not found: ${NGROK_CONFIG}"
        exit 1
    fi

    # Merge saved CLI authentication/settings with this project's tunnel.
    # Start only "demo" below, never unrelated tunnels from the saved config.
    local -a config_args=()
    local saved_config="" config_check=""
    if config_check=$(ngrok config check 2>/dev/null); then
        saved_config="${config_check#Valid configuration file at }"
        if [[ -f "$saved_config" && "$saved_config" != "$NGROK_CONFIG" ]]; then
            config_args+=(--config "$saved_config")
        fi
    fi
    config_args+=(--config "$NGROK_CONFIG")

    # Create temp file for error output
    local ngrok_log
    ngrok_log=$(mktemp)

    # Start ngrok in background, capturing stderr
    ngrok start demo "${config_args[@]}" >"$ngrok_log" 2>&1 &
    NGROK_PID=$!

    # Give ngrok a moment to start (increase to 2s for slower connections)
    sleep 2

    # Verify process is running
    if ! kill -0 "$NGROK_PID" 2>/dev/null; then
        print_error "ngrok failed to start"
        # Error output can contain credentials. Emit only ngrok's diagnostic code.
        local error_code
        error_code=$(grep -oE 'ERR_NGROK_[0-9]+' "$ngrok_log" | head -1 || true)
        print_error "${error_code:-No diagnostic code}; check ngrok authentication and configuration."
        rm -f "$ngrok_log"
        exit 1
    fi

    rm -f "$ngrok_log"
    print_success "ngrok started (PID: ${NGROK_PID})"
}

# Extract URL using wait-for-tunnels.sh
extract_url() {
    local wait_script="${SCRIPT_DIR}/wait-for-tunnels.sh"
    local output

    if [[ ! -x "$wait_script" ]]; then
        print_error "wait-for-tunnels.sh not found or not executable"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi

    # Run wait-for-tunnels.sh and capture output
    if ! output=$("$wait_script" --timeout "$TIMEOUT" --api-port "$API_PORT"); then
        print_error "Failed to extract tunnel URL"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi

    # Parse output for URL
    DEMO_URL=$(echo "$output" | grep '^DEMO_URL=' | cut -d= -f2)

    if [[ -z "$DEMO_URL" ]]; then
        print_error "Could not extract tunnel URL"
        kill "$NGROK_PID" 2>/dev/null || true
        exit 1
    fi
}

# Main function
main() {
    parse_args "$@"

    # Verify ngrok is available
    check_ngrok

    # Generate config from template (substitutes env vars)
    generate_config

    # Start ngrok
    start_ngrok

    # Wait for tunnel and extract URL
    extract_url

    # Output results in parseable format
    echo "NGROK_PID=${NGROK_PID}"
    echo "DEMO_URL=${DEMO_URL}"

    exit 0
}

# Run main function
main "$@"
