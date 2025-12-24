#!/bin/bash
set -e

rm -rf tests/fixtures/output/cpp
npm run build

REPO_ROOT="$(pwd)"
INPUT_DIR="tests/fixtures/input/cpp"
OUTPUT_DIR="tests/fixtures/output/cpp"

# Path to clang-format (if not in PATH)
CLANG_FORMAT_PATH="/data/home/mlobakh/.local/clang.tmp/bin/clang-format"

if [ -f "$CLANG_FORMAT_PATH" ]; then
  echo "Using clang-format: $CLANG_FORMAT_PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "$INPUT_DIR" \
    --output "$OUTPUT_DIR" \
    --verbose \
    --clang-format="$CLANG_FORMAT_PATH"
else
  echo "Using clang-format from PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "$INPUT_DIR" \
    --output "$OUTPUT_DIR" \
    --verbose
fi

echo ""
echo "Check long lines before formatting:"
scripts/check_long_lines.sh -x cpp \
    -p "$REPO_ROOT/$INPUT_DIR" \
    -o "$OUTPUT_DIR/long_lines_before.csv"

echo ""
echo "Check long lines after formatting:"
scripts/check_long_lines.sh -x cpp \
    -p "$REPO_ROOT/$OUTPUT_DIR" \
    -o "$OUTPUT_DIR/long_lines_after.csv"

echo ""
echo "Compare results:"
echo "Input:  $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
