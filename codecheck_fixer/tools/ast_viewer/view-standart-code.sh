#!/bin/bash

# Copyright (c) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
