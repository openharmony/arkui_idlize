#!/bin/bash
set -e

# Get the directory where the script is located.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Ensure we are in the project root directory
cd "$SCRIPT_DIR"

# Check for Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    log_error "Node.js and npm are required to run this script."
    exit 1
fi

# Install dependencies if node_modules directory doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "node_modules not found. Installing dependencies with npm..."
    npm install
fi

# Build the project if the dist directory doesn't exist
if [ ! -d "dist" ]; then
    log_info "'dist' directory not found. Building the project..."
    npm run build
fi

log_info "Executing: node dist/src/cli/index.js $@"
echo ""

# Run the CLI tool with all arguments passed to the script
node dist/src/cli/index.js "$@"
