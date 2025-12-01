#!/bin/bash
set -e

#
# Использование:
#   scripts/check_long_lines.sh [-o|--output path/to/report.csv] [-p|--path PATH[,PATH2...]]... [FILES_OR_DIRS ...]
#
# По умолчанию ищет C/C++ файлы в текущем каталоге.
# Если указаны позиционные аргументы, будут проанализированы только они:
#   - файл(ы): анализируются напрямую
#   - директория(и): производится поиск файлов с расширениями *.cpp, *.cc, *.cxx, *.c++, *.hpp, *.h
#   - glob-паттерны разрешаются оболочкой и анализируются как список файлов
#

# Дефолтные значения
DEFAULT_OUTPUT_FILE="long_lines.csv"
DEFAULT_MAX_LENGTH=120
DEFAULT_EXTENSIONS_CPP=( "*.cpp" "*.cc" "*.cxx" "*.c++" "*.hpp" "*.h" )
DEFAULT_EXTENSIONS_TS=( "*.ts" )
DEFAULT_EXTENSIONS_ETS=( "*.ets" )
DEFAULT_EXTENSIONS_TS_ETS=( "*.ts" "*.ets" )
DEFAULT_SEARCH_PATHS=( "$(pwd)" )
# Набор расширений по умолчанию (может быть переопределён ключом -x/--ext)
DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_CPP[@]}" )

# Текущая конфигурация (инициализируется дефолтами)
OUTPUT_FILE="$DEFAULT_OUTPUT_FILE"
MAX_LENGTH="$DEFAULT_MAX_LENGTH"
ARGS=( "${DEFAULT_SEARCH_PATHS[@]}" )
PATHS_SET=false

show_help() {
    echo "Использование: $0 [-o|--output REPORT_CSV] [-p|--path PATH[,PATH2...]]... [FILES_OR_DIRS ...]"
    echo ""
    echo "Опции:"
    echo "  -o, --output FILE   Путь к CSV-отчету (по умолчанию: $DEFAULT_OUTPUT_FILE)"
    echo "  -p, --path PATHS    Файл/директория/паттерн для анализа; можно указывать несколько раз или через запятую"
    echo "  -x, --ext TYPE      Набор расширений: cpp | ets | ts | ts_ets | all (по умолчанию: cpp)"
    echo "  -h, --help          Показать справку"
    echo ""
    echo "Примеры:"
    echo "  $0                                                        # проверить текущий каталог"
    echo "  $0 -o out/report.csv src include/                           # отчет в out/report.csv, анализ двух директорий"
    echo "  $0 -o report.csv -p file1.cpp -p 'dir/**/*.h'               # через ключи --path"
    echo "  $0 -p src,include -p file1.cpp                              # список путей через запятую"
    echo "  $0 -x ets -p foundation/.../arkui-ohos/src                  # анализ ETS-файлов"
    echo "  $0 -x all -p src                                            # анализ cpp+ts+ets"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -p|--path)
            if [[ "$PATHS_SET" == false ]]; then
                ARGS=()
                PATHS_SET=true
            fi
            IFS=',' read -r -a __paths <<< "$2"
            for __p in "${__paths[@]}"; do
                ARGS+=("$__p")
            done
            unset __paths __p
            shift 2
            ;;
        -x|--ext)
            case "$2" in
                cpp)
                    DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_CPP[@]}" )
                    ;;
                ets)
                    DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_ETS[@]}" )
                    ;;
                ts)
                    DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_TS[@]}" )
                    ;;
                ts_ets)
                    DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_TS_ETS[@]}" )
                    ;;
                all)
                    DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_CPP[@]}" "${DEFAULT_EXTENSIONS_TS[@]}" "${DEFAULT_EXTENSIONS_ETS[@]}" )
                    ;;
                *)
                    echo "Неизвестное значение для --ext: $2 (ожидается: cpp | ets | ts | ts_ets | all)" >&2
                    exit 1
                    ;;
            esac
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Неизвестная опция: $1" >&2
            show_help
            exit 1
            ;;
        *)
            if [[ "$PATHS_SET" == false ]]; then
                ARGS=()
                PATHS_SET=true
            fi
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Если аргументы остались после "--", добавим их как пути
if [[ $# -gt 0 ]]; then
    while [[ $# -gt 0 ]]; do
        if [[ "$PATHS_SET" == false ]]; then
            ARGS=()
            PATHS_SET=true
        fi
        ARGS+=("$1")
        shift
    done
fi

# Подготовим файл отчета
mkdir -p "$(dirname "$OUTPUT_FILE")"
echo "filename,line_number,length,text" > "$OUTPUT_FILE"

# Общий awk-скрипт для поиска длинных строк (использует переменную max_len)
AWK_SCRIPT='BEGIN { PROCINFO["encoding"] = "utf-8" }
length($0) > max_len {
    sub(/^\xef\xbb\xbf/, "")
    line_len = length($0)
    gsub(/"/, "\"\"")
    printf "%s,%d,%d,\"%s\"\n", FILENAME, FNR, line_len, $0
}'

# Разбор переданных путей/паттернов (ARGS уже содержит дефолты, если пользователь их не переопределил)
# shopt -s — включает опции оболочки Bash.
# nullglob — шаблоны без совпадений разворачиваются в пустой список (а не остаются строкой pattern), чтобы не передавать «сырые» паттерны дальше.
# globstar — включает рекурсивный глов **, позволяющий матчить вложенные директории.
shopt -s nullglob globstar

# Подготовка выражения для find по расширениям
FIND_NAME_EXPR=()
for __ext in "${DEFAULT_EXTENSIONS[@]}"; do
    if [[ ${#FIND_NAME_EXPR[@]} -gt 0 ]]; then
        FIND_NAME_EXPR+=( -o )
    fi
    FIND_NAME_EXPR+=( -name "$__ext" )
done
unset __ext

# Сначала соберем явные файлы из переданных аргументов (после раскрытия glob)
FILES_TO_CHECK=()
DIRS_TO_SCAN=()

for arg in "${ARGS[@]}"; do
    # Раскрываем паттерны оболочки (если есть)
    matches=( $arg )
    if [[ ${#matches[@]} -eq 0 ]]; then
        # Если ничего не сматчилось, оставим как есть — может быть путь с пробелами в кавычках
        matches=("$arg")
    fi

    for m in "${matches[@]}"; do
        if [[ -d "$m" ]]; then
            DIRS_TO_SCAN+=("$m")
        elif [[ -f "$m" ]]; then
            FILES_TO_CHECK+=("$m")
        fi
    done
done

# Прогоним awk по явным файлам, если они есть
if [[ ${#FILES_TO_CHECK[@]} -gt 0 ]]; then
    gawk -v max_len="$MAX_LENGTH" "$AWK_SCRIPT" "${FILES_TO_CHECK[@]}" >> "$OUTPUT_FILE"
fi

# Для директорий — используем find с фильтром по расширениям
for d in "${DIRS_TO_SCAN[@]}"; do
    find "$d" -type f \( "${FIND_NAME_EXPR[@]}" \) -exec gawk -v max_len="$MAX_LENGTH" "$AWK_SCRIPT" {} + >> "$OUTPUT_FILE"
done

# Подсчёт уникальных строк отчёта (без заголовка)
cut -d';' -f1 "$OUTPUT_FILE" | tail -n +2 | sort | uniq | wc -l
