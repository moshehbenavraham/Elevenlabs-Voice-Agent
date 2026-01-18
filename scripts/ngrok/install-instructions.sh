#!/usr/bin/env bash
# install-instructions.sh - Platform-specific ngrok installation guide
#
# Description:
#   Detects the current platform and displays appropriate ngrok
#   installation instructions. Does NOT install automatically.
#
# Supported Platforms:
#   - Linux (apt, snap, curl)
#   - macOS (Homebrew, curl)
#   - Windows/WSL (winget, choco, curl)
#
# Usage:
#   ./install-instructions.sh
#
# Part of Voice-Agent-PuPuPlatter ngrok demo infrastructure

set -euo pipefail

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    BLUE=''
    CYAN=''
    GREEN=''
    YELLOW=''
    BOLD=''
    NC=''
fi

# Function to print section header
print_header() {
    printf "\n%b=== %s ===%b\n\n" "${BOLD}${BLUE}" "$1" "${NC}"
}

# Function to print a command suggestion
print_command() {
    printf "  %b%s%b\n" "${CYAN}" "$1" "${NC}"
}

# Function to print info text
print_info() {
    printf "  %s\n" "$1"
}

# Detect platform
detect_platform() {
    local os
    os=$(uname -s)

    case "${os}" in
        Linux*)
            # Check if running in WSL
            if grep -qiE "(microsoft|wsl)" /proc/version 2>/dev/null; then
                echo "wsl"
            else
                echo "linux"
            fi
            ;;
        Darwin*)
            echo "macos"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Linux installation instructions
show_linux_instructions() {
    print_header "ngrok Installation Instructions (Linux)"

    printf "%bOption 1: Using apt (Debian/Ubuntu)%b\n" "${GREEN}" "${NC}"
    print_info "Add ngrok repository and install:"
    print_command "curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \\"
    print_command "  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null"
    print_command "echo \"deb https://ngrok-agent.s3.amazonaws.com buster main\" \\"
    print_command "  | sudo tee /etc/apt/sources.list.d/ngrok.list"
    print_command "sudo apt update && sudo apt install ngrok"
    echo ""

    printf "%bOption 2: Using snap%b\n" "${GREEN}" "${NC}"
    print_info "Install via Snap Store:"
    print_command "sudo snap install ngrok"
    echo ""

    printf "%bOption 3: Direct download (any Linux)%b\n" "${GREEN}" "${NC}"
    print_info "Download and install manually:"
    print_command "curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz \\"
    print_command "  | sudo tar -xzf - -C /usr/local/bin"
    echo ""
}

# macOS installation instructions
show_macos_instructions() {
    print_header "ngrok Installation Instructions (macOS)"

    printf "%bOption 1: Using Homebrew (Recommended)%b\n" "${GREEN}" "${NC}"
    print_info "Install via Homebrew:"
    print_command "brew install ngrok"
    echo ""

    printf "%bOption 2: Direct download%b\n" "${GREEN}" "${NC}"
    print_info "Download and install manually:"
    print_command "curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip -o ngrok.zip"
    print_command "unzip ngrok.zip && sudo mv ngrok /usr/local/bin/"
    echo ""

    print_info "For Apple Silicon (M1/M2/M3):"
    print_command "curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip -o ngrok.zip"
    print_command "unzip ngrok.zip && sudo mv ngrok /usr/local/bin/"
    echo ""
}

# Windows/WSL installation instructions
show_windows_instructions() {
    print_header "ngrok Installation Instructions (Windows/WSL)"

    printf "%bFor WSL (Windows Subsystem for Linux):%b\n" "${GREEN}" "${NC}"
    print_info "Use the Linux installation method inside WSL:"
    print_command "curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz \\"
    print_command "  | sudo tar -xzf - -C /usr/local/bin"
    echo ""

    printf "%bFor Windows native (PowerShell):%b\n" "${GREEN}" "${NC}"
    print_info "Using winget:"
    print_command "winget install ngrok.ngrok"
    echo ""

    print_info "Using Chocolatey:"
    print_command "choco install ngrok"
    echo ""

    print_info "Manual download:"
    print_command "Download from: https://ngrok.com/download"
    print_command "Extract and add to PATH"
    echo ""
}

# Generic/unknown platform instructions
show_generic_instructions() {
    print_header "ngrok Installation Instructions"

    printf "%bVisit the official download page:%b\n" "${GREEN}" "${NC}"
    print_command "https://ngrok.com/download"
    echo ""

    print_info "1. Download the appropriate version for your system"
    print_info "2. Extract the archive"
    print_info "3. Move the ngrok binary to a directory in your PATH"
    print_info "4. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
}

# Post-install instructions (common to all platforms)
show_post_install() {
    print_header "After Installation"

    printf "%bStep 1: Get your auth token%b\n" "${YELLOW}" "${NC}"
    print_info "Sign up or log in at: https://dashboard.ngrok.com"
    print_info "Copy your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""

    printf "%bStep 2: Configure ngrok%b\n" "${YELLOW}" "${NC}"
    print_command "ngrok config add-authtoken YOUR_AUTH_TOKEN"
    echo ""

    printf "%bStep 3: Verify installation%b\n" "${YELLOW}" "${NC}"
    print_command "./scripts/ngrok/detect-ngrok.sh"
    echo ""

    printf "%bStep 4: (Optional) Set environment variables%b\n" "${YELLOW}" "${NC}"
    print_info "Copy .env.example to .env and set:"
    print_info "  NGROK_AUTHTOKEN=your_token"
    print_info "  NGROK_DOMAIN=your-custom-domain.ngrok.dev  (paid plans)"
    print_info "  NGROK_AUTH_USER=demo_user                   (optional)"
    print_info "  NGROK_AUTH_PASS=demo_password               (optional)"
    echo ""
}

# Main function
main() {
    local platform
    platform=$(detect_platform)

    printf "%bDetected platform: %s%b\n" "${BOLD}" "${platform}" "${NC}"

    case "${platform}" in
        linux)
            show_linux_instructions
            ;;
        macos)
            show_macos_instructions
            ;;
        wsl|windows)
            show_windows_instructions
            ;;
        *)
            show_generic_instructions
            ;;
    esac

    show_post_install
}

# Run main function
main "$@"
