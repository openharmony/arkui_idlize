#!/bin/bash

# Скрипт для просмотра Enhanced AST файла
# Использование: ./view-enhanced-file.sh

# Настройки
FILE_PATH="./test01.ets"
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

# Проверяем существование файла
if [ ! -f "$FILE_PATH" ]; then
    echo "Ошибка: файл $FILE_PATH не найден"
    echo "Отредактируйте скрипт и укажите правильный путь к файлу"
    exit 1
fi

# Проверяем существование Enhanced AST viewer
if [ ! -f "./enhanced-ast-viewer.ts" ]; then
    echo "Ошибка: Enhanced AST viewer не найден"
    exit 1
fi

# Выводим информацию о запуске
echo "Анализ Enhanced AST файла: $FILE_PATH"
echo "Рабочая директория: $(pwd)"
if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
    echo "Дополнительные параметры: ${EXTRA_ARGS[*]}"
fi
echo ""

# Запускаем Enhanced AST viewer
npx ts-node ./enhanced-ast-viewer.ts "${EXTRA_ARGS[@]}" "$FILE_PATH" > ./out_enhanced_tree.log 2>&1

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "Анализ завершен успешно"
    echo "Результат сохранен в: out_enhanced_tree.log"
    echo ""
    echo "Для просмотра результата:"
    echo "  cat out_enhanced_tree.log"
    echo "  less out_enhanced_tree.log"
    echo "  code out_enhanced_tree.log"
else
    echo "Ошибка при анализе файла"
    echo "Проверьте out_enhanced_tree.log для деталей"
fi
