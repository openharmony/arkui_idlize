#!/bin/bash

# AST Viewer - анализ кода напрямую
# Отредактируйте переменную CODE, указав нужный код для анализа

# =============================================================================
# НАСТРОЙКИ - ИЗМЕНИТЕ ЗДЕСЬ КОД ДЛЯ АНАЛИЗА
# =============================================================================

# Укажите код, который хотите проанализировать
CODE="const x = 42;"

# Альтернативные примеры (раскомментируйте нужный):
# CODE="export const x = 42;"
# CODE="function test(a: string): number { return 42; }"
# CODE="interface MyInterface { prop: string; method(): void; }"
# CODE="class MyClass extends BaseClass { constructor(private value: number) {} } { export const x = 42; function test(a: string): number { return 42; } }"

# =============================================================================
# ВЫПОЛНЕНИЕ (НЕ ИЗМЕНЯЙТЕ)
# =============================================================================

# Переходим в директорию скрипта
cd "$(dirname "$0")"

# Выводим информацию о запуске
echo "Анализ AST кода: $CODE"
echo "Рабочая директория: $(pwd)"
echo ""

# Запускаем Standard AST viewer
npx ts-node ./standard-ast-viewer.ts --code "$CODE"
