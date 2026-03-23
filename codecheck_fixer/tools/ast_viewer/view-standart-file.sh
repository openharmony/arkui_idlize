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

# AST Viewer - launch script
# Edit the FILE_PATH variable, specifying the file to analyze

# =============================================================================
# SETTINGS - CHANGE FILE PATH HERE
# =============================================================================

# Specify path to file you want to analyze
# FILE_PATH="../libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts"
FILE_PATH="./test01.ets"

# Alternative examples (uncomment the one you need):
# FILE_PATH="../libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts"
# FILE_PATH="../tests/enhanced_ast/test-tokens.ts"
# FILE_PATH="/absolute/path/to/your/file.ts"
# FILE_PATH="/data/home/mlobakh/BZ_OHOS/OHOS/foundation/arkui/ace_engine/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated/AlphabetIndexerModifier.ets"

# =============================================================================
# EXECUTION (DO NOT CHANGE)
# =============================================================================

# Change to script directory
cd "$(dirname "$0")"

# Check file existence
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: File '$FILE_PATH' not found!"
    echo ""
    echo "Edit the script and specify correct file path in FILE_PATH variable"
    exit 1
fi

# Output launch information
echo "Analyzing AST of file: $FILE_PATH"
echo "Working directory: $(pwd)"
echo ""

# Run Standard AST viewer
npx ts-node ./standard-ast-viewer.ts "$FILE_PATH" > ./out_standart_tree.log 2>&1
