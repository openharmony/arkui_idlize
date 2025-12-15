#!/bin/bash

# Скрипт для просмотра Enhanced AST кода
# Использование: ./view-enhanced-code.sh

# Настройки
CODE="export const x = 42;"
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

# Проверяем, что Viewer лежит рядом
if [ ! -f "./enhanced-ast-viewer.ts" ]; then
    echo "Ошибка: enhanced-ast-viewer.ts не найден в $(pwd)"
    exit 1
fi

# Выводим информацию о запуске
echo "Анализ Enhanced AST кода: $CODE"
echo "Рабочая директория: $(pwd)"
echo ""

# Запускаем Enhanced AST viewer
npx ts-node ./enhanced-ast-viewer.ts "${EXTRA_ARGS[@]}" --code "$CODE"
