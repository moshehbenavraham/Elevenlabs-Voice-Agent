#!/usr/bin/env bash
# reset-dev-mode.sh - Reset to clean local development state
#
# Use this script after running demo mode to ensure a clean
# local development environment. Kills processes, clears ports,
# and removes generated config files.
#
# Usage:
#   ./scripts/reset-dev-mode.sh
#
# Exit Codes:
#   0 - Clean reset successful
#   1 - Some cleanup steps failed (but continued)

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Ports to clear
PORTS=(3001 8082 4041)

# Files to remove
FILES_TO_REMOVE=(
    "${PROJECT_ROOT}/dist/config.js"
    "${PROJECT_ROOT}/server/.env.demo"
    "${PROJECT_ROOT}/scripts/ngrok/ngrok.yml"
)

# Config stub for local development (prevents 404 errors)
CONFIG_JS_PATH="${PROJECT_ROOT}/public/config.js"
CONFIG_STUB='/* Local development mode - no runtime config override */
/* This file is overwritten by demo mode with actual ngrok URLs */'

# Process patterns to kill
PROCESS_PATTERNS=(
    "ngrok"
    "vite"
    "node.*server/index"
)

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

# Kill processes matching patterns
kill_processes() {
    print_header "Killing Processes"

    local killed=0

    for pattern in "${PROCESS_PATTERNS[@]}"; do
        if pgrep -f "$pattern" >/dev/null 2>&1; then
            print_info "Killing processes matching: $pattern"
            pkill -f "$pattern" 2>/dev/null && killed=1 || true
        fi
    done

    if [[ $killed -eq 1 ]]; then
        print_success "Processes terminated"
        sleep 1  # Give processes time to exit
    else
        print_info "No matching processes found"
    fi
}

# Clear ports
clear_ports() {
    print_header "Clearing Ports"

    for port in "${PORTS[@]}"; do
        if command -v lsof >/dev/null 2>&1; then
            local pids
            pids=$(lsof -ti :"$port" 2>/dev/null || true)

            if [[ -n "$pids" ]]; then
                print_info "Clearing port $port..."
                echo "$pids" | xargs kill -9 2>/dev/null || true
                print_success "Port $port cleared"
            else
                print_info "Port $port already free"
            fi
        else
            print_warning "lsof not available, skipping port check for $port"
        fi
    done
}

# Remove generated files
remove_files() {
    print_header "Removing Generated Files"

    for file in "${FILES_TO_REMOVE[@]}"; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            print_success "Removed: ${file#$PROJECT_ROOT/}"
        else
            print_info "Not found: ${file#$PROJECT_ROOT/}"
        fi
    done

    # Reset public/config.js to no-op stub (prevents 404 errors in local dev)
    if [[ -f "$CONFIG_JS_PATH" ]] && grep -q "__DEMO_CONFIG__" "$CONFIG_JS_PATH" 2>/dev/null; then
        echo "$CONFIG_STUB" > "$CONFIG_JS_PATH"
        print_success "Reset: public/config.js to local stub"
    elif [[ ! -f "$CONFIG_JS_PATH" ]]; then
        echo "$CONFIG_STUB" > "$CONFIG_JS_PATH"
        print_success "Created: public/config.js stub"
    else
        print_info "public/config.js already clean"
    fi
}

# Verify clean state
verify_state() {
    print_header "Verifying Clean State"

    local clean=1

    # Check ports
    for port in "${PORTS[@]}"; do
        if command -v lsof >/dev/null 2>&1; then
            if lsof -i :"$port" >/dev/null 2>&1; then
                print_error "Port $port still in use"
                clean=0
            else
                print_success "Port $port is free"
            fi
        fi
    done

    # Check files
    for file in "${FILES_TO_REMOVE[@]}"; do
        if [[ -f "$file" ]]; then
            print_error "File still exists: ${file#$PROJECT_ROOT/}"
            clean=0
        fi
    done

    # Verify public/config.js is clean stub (not demo config)
    if [[ -f "$CONFIG_JS_PATH" ]]; then
        if grep -q "__DEMO_CONFIG__" "$CONFIG_JS_PATH" 2>/dev/null; then
            print_error "public/config.js still contains demo config"
            clean=0
        else
            print_success "public/config.js is clean stub"
        fi
    else
        print_warning "public/config.js missing (will cause 404)"
        clean=0
    fi

    # Check processes
    for pattern in "${PROCESS_PATTERNS[@]}"; do
        if pgrep -f "$pattern" >/dev/null 2>&1; then
            print_warning "Process still running: $pattern"
            clean=0
        fi
    done

    echo ""
    if [[ $clean -eq 1 ]]; then
        print_success "Environment is clean - ready for local development"
        echo ""
        echo -e "  Start local dev with: ${GREEN}npm run dev:all${NC}"
        echo ""
        return 0
    else
        print_warning "Some items could not be cleaned"
        echo ""
        echo "  Try running the script again, or manually clean up."
        echo ""
        return 1
    fi
}

# Main
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║  Reset to Local Development Mode       ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    kill_processes
    clear_ports
    remove_files
    verify_state
}

main "$@"
