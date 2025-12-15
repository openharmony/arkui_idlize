#!/usr/bin/env bash
set -euo pipefail

# Запуск юнит-тестов Jest с ts-jest конфигурацией
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run tests" >&2
  exit 1
fi

export NODE_ENV=test

usage() {
  cat <<EOF
Usage: ./run_unit_tests.sh [keys ...] [--] [jest-args]

Keys (можно несколько, через пробел или --keys csv):
  llf | line-length | line-length-formatter     tests/unittests/line-length-formatter
  normalizer | expr | expression-normalizer     tests/unittests/expression-normalizer
  array-literal                                 конкретный файл array-literal.test.ts
  <произвольная_строка>                         шаблон файла: **/*<строка>*\.test\.ts

Опции:
  -k, --keys csv           Список ключей через запятую
  -t, --test-name pattern  Jest --testNamePattern
  -w, --watch              Jest --watch
  -h, --help               Показать справку

Примеры:
  ./run_unit_tests.sh                       # все unit-тесты
  ./run_unit_tests.sh llf                   # только line-length-formatter
  ./run_unit_tests.sh normalizer            # только нормализатор выражений
  ./run_unit_tests.sh array-literal         # конкретный тест-файл по ключу
  ./run_unit_tests.sh -k llf,normalizer     # несколько ключей
  ./run_unit_tests.sh -t "Equivalent pairs" # фильтр по имени теста
EOF
}

TARGETS=()
TEST_NAME_PATTERN=""
WATCH=0

add_key() {
  local key="$1"
  case "$key" in
    llf|line-length|line-length-formatter)
      TARGETS+=("$SCRIPT_DIR/tests/unittests/line-length-formatter")
      ;;
    normalizer|expr|expression-normalizer)
      TARGETS+=("$SCRIPT_DIR/tests/unittests/expression-normalizer")
      ;;
    array-literal)
      TARGETS+=("$SCRIPT_DIR/tests/unittests/line-length-formatter/array-literal.test.ts")
      ;;
    *)
      TARGETS+=("$SCRIPT_DIR/tests/unittests/**/*${key}*.test.ts")
      ;;
  esac
}

if [[ $# -gt 0 ]]; then
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -k|--keys)
        IFS=',' read -r -a KEYS <<< "$2"; shift 2 || true
        for k in "${KEYS[@]}"; do add_key "$k"; done
        ;;
      -t|--test-name)
        TEST_NAME_PATTERN="${2:-}"; shift 2 || true
        ;;
      -w|--watch)
        WATCH=1; shift
        ;;
      -h|--help)
        usage; exit 0
        ;;
      --)
        shift; break
        ;;
      *)
        add_key "$1"; shift
        ;;
    esac
  done
fi

JEST_ARGS=("--config" "$SCRIPT_DIR/jest.config.cjs")
[[ -n "$TEST_NAME_PATTERN" ]] && JEST_ARGS+=("--testNamePattern" "$TEST_NAME_PATTERN")
[[ "$WATCH" -eq 1 ]] && JEST_ARGS+=("--watch")

# Если ключи не заданы — запускаем весь каталог unit-тестов
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=("$SCRIPT_DIR/tests/unittests")
fi

# Пробрасываем остаточные аргументы к Jest
npx jest "${JEST_ARGS[@]}" "${TARGETS[@]}" "$@"


