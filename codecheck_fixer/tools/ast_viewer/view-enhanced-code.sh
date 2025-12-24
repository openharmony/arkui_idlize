#!/bin/bash

# Script for viewing Enhanced AST of code
# Usage: ./view-enhanced-code.sh

# Settings
CODE="export const x = 42;"
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

# Check that Viewer is nearby
if [ ! -f "./enhanced-ast-viewer.ts" ]; then
    echo "Error: enhanced-ast-viewer.ts not found in $(pwd)"
    exit 1
fi

# Output launch information
echo "Analyzing Enhanced AST of code: $CODE"
echo "Working directory: $(pwd)"
echo ""

# Run Enhanced AST viewer
npx ts-node ./enhanced-ast-viewer.ts "${EXTRA_ARGS[@]}" --code "$CODE"
