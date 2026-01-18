#!/usr/bin/env bash
# output-formatter.sh - Reusable terminal formatting functions
#
# Description:
#   Provides color-coded output and box-drawing functions for consistent
#   terminal styling across all ngrok demo mode scripts.
#
# Features:
#   - Color-coded status messages (success, error, warning, info)
#   - NO_COLOR environment variable support for accessibility
#   - TTY detection for graceful degradation to non-color output
#   - ASCII-only box drawing for copy-paste friendly output
#   - Screen reader friendly output (text labels, not just colors)
#
# Usage:
#   Source this file in other scripts:
#     source "$(dirname "${BASH_SOURCE[0]}")/output-formatter.sh"
#
#   Then use the provided functions:
#     print_success "Task completed"
#     print_error "Something went wrong"
#     print_warning "Proceed with caution"
#     print_info "Processing..."
#     print_header "Section Title"
#     print_divider
#     print_box_top 60
#     print_box_line 60 "Content here"
#     print_box_bottom 60
#
# Environment Variables:
#   NO_COLOR - Set to any value to disable color output (accessibility)
#   TERM - Used to detect terminal capabilities
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

# Strict mode - fail fast on errors
set -euo pipefail

# =============================================================================
# Color Initialization
# =============================================================================

# Initialize color variables based on terminal capabilities
# Colors are disabled if:
#   1. NO_COLOR environment variable is set (accessibility standard)
#   2. Output is not a terminal (piping to file)
#   3. TERM is "dumb" (limited terminal)
_init_colors() {
    # Check for color support
    if [[ -n "${NO_COLOR:-}" ]] || [[ ! -t 1 ]] || [[ "${TERM:-dumb}" == "dumb" ]]; then
        # No color mode
        COLOR_RESET=""
        COLOR_RED=""
        COLOR_GREEN=""
        COLOR_YELLOW=""
        COLOR_BLUE=""
        COLOR_BOLD=""
        COLORS_ENABLED=0
    else
        # Color mode enabled
        COLOR_RESET='\033[0m'
        COLOR_RED='\033[0;31m'
        COLOR_GREEN='\033[0;32m'
        COLOR_YELLOW='\033[1;33m'
        COLOR_BLUE='\033[0;34m'
        COLOR_BOLD='\033[1m'
        COLORS_ENABLED=1
    fi
}

# Initialize colors on source
_init_colors

# =============================================================================
# Status Message Functions
# =============================================================================

# Print success message with green [OK] prefix
# Arguments:
#   $1 - Message to display
print_success() {
    printf "%b[OK]%b %s\n" "${COLOR_GREEN}" "${COLOR_RESET}" "$1"
}

# Print error message with red [ERROR] prefix to stderr
# Arguments:
#   $1 - Message to display
print_error() {
    printf "%b[ERROR]%b %s\n" "${COLOR_RED}" "${COLOR_RESET}" "$1" >&2
}

# Print warning message with yellow [WARN] prefix
# Arguments:
#   $1 - Message to display
print_warning() {
    printf "%b[WARN]%b %s\n" "${COLOR_YELLOW}" "${COLOR_RESET}" "$1"
}

# Print info message with blue [INFO] prefix
# Arguments:
#   $1 - Message to display
print_info() {
    printf "%b[INFO]%b %s\n" "${COLOR_BLUE}" "${COLOR_RESET}" "$1"
}

# =============================================================================
# Section Formatting Functions
# =============================================================================

# Print a section header with optional color
# Arguments:
#   $1 - Header text
print_header() {
    local text="$1"
    printf "\n%b%s%b\n" "${COLOR_BOLD}" "$text" "${COLOR_RESET}"
}

# Print a horizontal divider line
# Arguments:
#   $1 - Width (default: 60)
print_divider() {
    local width="${1:-60}"
    printf '%*s\n' "$width" '' | tr ' ' '='
}

# =============================================================================
# Box Drawing Functions (ASCII-only)
# =============================================================================

# Print the top border of a box
# Uses ASCII characters for copy-paste compatibility
# Arguments:
#   $1 - Box width (default: 60)
print_box_top() {
    local width="${1:-60}"
    local inner=$((width - 2))
    printf '+%s+\n' "$(printf '%*s' "$inner" '' | tr ' ' '-')"
}

# Print the bottom border of a box
# Arguments:
#   $1 - Box width (default: 60)
print_box_bottom() {
    local width="${1:-60}"
    local inner=$((width - 2))
    printf '+%s+\n' "$(printf '%*s' "$inner" '' | tr ' ' '-')"
}

# Print a line inside a box with proper padding
# Arguments:
#   $1 - Box width (default: 60)
#   $2 - Content to display (optional)
print_box_line() {
    local width="${1:-60}"
    local content="${2:-}"
    local inner=$((width - 4))

    # Calculate content length (strip ANSI codes for length calculation)
    local plain_content
    plain_content=$(printf '%s' "$content" | sed 's/\x1b\[[0-9;]*m//g')
    local content_len=${#plain_content}

    # Calculate padding
    local padding=$((inner - content_len))
    if [[ $padding -lt 0 ]]; then
        padding=0
    fi

    printf '| %s%*s |\n' "$content" "$padding" ''
}

# Print an empty line inside a box
# Arguments:
#   $1 - Box width (default: 60)
print_box_empty() {
    local width="${1:-60}"
    local inner=$((width - 4))
    printf '| %*s |\n' "$inner" ''
}

# =============================================================================
# Utility Functions
# =============================================================================

# Check if colors are enabled
# Returns: 0 if colors enabled, 1 if disabled
colors_enabled() {
    [[ "${COLORS_ENABLED:-0}" -eq 1 ]]
}

# Get the current terminal width (with fallback)
# Returns: Terminal width or default of 80
get_terminal_width() {
    if command -v tput >/dev/null 2>&1 && [[ -t 1 ]]; then
        tput cols 2>/dev/null || echo "80"
    else
        echo "80"
    fi
}
