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
