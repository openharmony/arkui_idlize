#!/bin/bash
# Скрипт для копирования output файлов в expected
# Используется после проверки результатов форматирования

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/../fixtures"
OUTPUT_DIR="$FIXTURES_DIR/output"
EXPECTED_DIR="$FIXTURES_DIR/expected"

if [ ! -d "$OUTPUT_DIR" ]; then
    echo "❌ Error: Output directory not found: $OUTPUT_DIR"
    echo "   Please run tests first to generate output files."
    exit 1
fi

echo "📋 This will copy all files from output/ to expected/"
echo "   Output:   $OUTPUT_DIR"
echo "   Expected: $EXPECTED_DIR"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Создаем expected директории если их нет
mkdir -p "$EXPECTED_DIR"/{ts,ets,cpp}

# Копируем файлы
copied=0
for type in ts ets cpp; do
    output_subdir="$OUTPUT_DIR/$type"
    expected_subdir="$EXPECTED_DIR/$type"
    
    if [ -d "$output_subdir" ]; then
        files=$(find "$output_subdir" -maxdepth 1 -type f -name "*.$type" 2>/dev/null || true)
        if [ -n "$files" ]; then
            for file in $files; do
                filename=$(basename "$file")
                cp "$file" "$expected_subdir/$filename"
                echo "✓ Copied: $type/$filename"
                copied=$((copied + 1))
            done
        fi
    fi
done

echo ""
echo "✅ Copied $copied file(s) to expected/"
echo "   You can now commit the updated expected files."

