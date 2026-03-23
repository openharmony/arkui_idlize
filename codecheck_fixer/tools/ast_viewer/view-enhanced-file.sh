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

# Script for viewing Enhanced AST of a file
# Usage: ./view-enhanced-file.sh

# Settings
FILE_PATH="./test01.ets"
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

# Check file existence
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: file $FILE_PATH not found"
    echo "Edit the script and specify correct file path"
    exit 1
fi

# Check Enhanced AST viewer existence
if [ ! -f "./enhanced-ast-viewer.ts" ]; then
    echo "Error: Enhanced AST viewer not found"
    exit 1
fi

# Output launch information
echo "Analyzing Enhanced AST of file: $FILE_PATH"
echo "Working directory: $(pwd)"
if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
    echo "Additional parameters: ${EXTRA_ARGS[*]}"
fi
echo ""

# Run Enhanced AST viewer
npx ts-node ./enhanced-ast-viewer.ts "${EXTRA_ARGS[@]}" "$FILE_PATH" > ./out_enhanced_tree.log 2>&1

# Check result
if [ $? -eq 0 ]; then
    echo "Analysis completed successfully"
    echo "Result saved in: out_enhanced_tree.log"
    echo ""
    echo "To view result:"
    echo "  cat out_enhanced_tree.log"
    echo "  less out_enhanced_tree.log"
    echo "  code out_enhanced_tree.log"
else
    echo "Error analyzing file"
    echo "Check out_enhanced_tree.log for details"
fi
