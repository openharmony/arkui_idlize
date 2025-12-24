#!/bin/bash

# AST Viewer - direct code analysis
# Edit the CODE variable, specifying the code to analyze

# =============================================================================
# SETTINGS - CHANGE CODE TO ANALYZE HERE
# =============================================================================

# Specify code you want to analyze
CODE="const x = 42;"

# Alternative examples (uncomment the one you need):
# CODE="export const x = 42;"
# CODE="function test(a: string): number { return 42; }"
# CODE="interface MyInterface { prop: string; method(): void; }"
# CODE="class MyClass extends BaseClass { constructor(private value: number) {} } { export const x = 42; function test(a: string): number { return 42; } }"

# =============================================================================
# EXECUTION (DO NOT CHANGE)
# =============================================================================

# Change to script directory
cd "$(dirname "$0")"

# Output launch information
echo "Analyzing AST of code: $CODE"
echo "Working directory: $(pwd)"
echo ""

# Run Standard AST viewer
npx ts-node ./standard-ast-viewer.ts --code "$CODE"
