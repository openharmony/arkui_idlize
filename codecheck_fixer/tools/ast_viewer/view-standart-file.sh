#!/bin/bash

# AST Viewer - пусковой скрипт
# Отредактируйте переменную FILE_PATH, указав нужный файл для анализа

# =============================================================================
# НАСТРОЙКИ - ИЗМЕНИТЕ ЗДЕСЬ ПУТЬ К ФАЙЛУ
# =============================================================================

# Укажите путь к файлу, который хотите проанализировать
# FILE_PATH="../libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts"
FILE_PATH="./test01.ets"

# Альтернативные примеры (раскомментируйте нужный):
# FILE_PATH="../libs/arkts_enhanced_ast/ast/enhanced-ast-types.ts"
# FILE_PATH="../tests/enhanced_ast/test-tokens.ts"
# FILE_PATH="/absolute/path/to/your/file.ts"
# FILE_PATH="/data/home/mlobakh/BZ_OHOS/OHOS/foundation/arkui/ace_engine/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/arkui-ohos/generated/AlphabetIndexerModifier.ets"

# =============================================================================
# ВЫПОЛНЕНИЕ (НЕ ИЗМЕНЯЙТЕ)
# =============================================================================

# Переходим в директорию скрипта
cd "$(dirname "$0")"

# Проверяем существование файла
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Ошибка: Файл '$FILE_PATH' не найден!"
    echo ""
    echo "Отредактируйте скрипт и укажите правильный путь к файлу в переменной FILE_PATH"
    exit 1
fi

# Выводим информацию о запуске
echo "Анализ AST файла: $FILE_PATH"
echo "Рабочая директория: $(pwd)"
echo ""

# Запускаем Standard AST viewer
npx ts-node ./standard-ast-viewer.ts "$FILE_PATH" > ./out_standart_tree.log 2>&1
