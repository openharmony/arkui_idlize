#!/bin/bash
set -e

#
# Usage:
#   scripts/check_long_lines.sh [-o|--output path/to/report.csv] [-p|--path PATH[,PATH2...]]... [FILES_OR_DIRS ...]
#
# By default searches for C/C++ files in current directory.
# If positional arguments are specified, only they will be analyzed:
#   - file(s): analyzed directly
#   - director(y/ies): search for files with extensions *.cpp, *.cc, *.cxx, *.c++, *.hpp, *.h
#   - glob patterns are resolved by shell and analyzed as file list
#

# Default values
DEFAULT_OUTPUT_FILE="long_lines.csv"
DEFAULT_MAX_LENGTH=120
DEFAULT_EXTENSIONS_CPP=( "*.cpp" "*.cc" "*.cxx" "*.c++" "*.hpp" "*.h" )
DEFAULT_EXTENSIONS_TS=( "*.ts" )
DEFAULT_EXTENSIONS_ETS=( "*.ets" )
DEFAULT_EXTENSIONS_TS_ETS=( "*.ts" "*.ets" )
DEFAULT_SEARCH_PATHS=( "$(pwd)" )
# Default extension set (can be overridden with -x/--ext key)
DEFAULT_EXTENSIONS=( "${DEFAULT_EXTENSIONS_CPP[@]}" )

# Current configuration (initialized with defaults)
OUTPUT_FILE="$DEFAULT_OUTPUT_FILE"
MAX_LENGTH="$DEFAULT_MAX_LENGTH"
ARGS=( "${DEFAULT_SEARCH_PATHS[@]}" )
PATHS_SET=false

show_help() {
    echo "Usage: $0 [-o|--output REPORT_CSV] [-p|--path PATH[,PATH2...]]... [FILES_OR_DIRS ...]"
    echo ""
    echo "Options:"
    echo "  -o, --output FILE   Path to CSV report (default: $DEFAULT_OUTPUT_FILE)"
    echo "  -p, --path PATHS    File/directory/pattern to analyze; can be specified multiple times or comma-separated"
    echo "  -x, --ext TYPE      Extension set: cpp | ets | ts | ts_ets | all (default: cpp)"
    echo "  -h, --help          Show help"
    echo ""
    echo "Examples:"
    echo "  $0                                                        # check current directory"
    echo "  $0 -o out/report.csv src include/                           # report to out/report.csv, analyze two directories"
    echo "  $0 -o report.csv -p file1.cpp -p 'dir/**/*.h'               # using --path keys"
    echo "  $0 -p src,include -p file1.cpp                              # path list comma-separated"
    echo "  $0 -x ets -p foundation/.../arkui-ohos/src                  # analyze ETS files"
    echo "  $0 -x all -p src                                            # analyze cpp+ts+ets"
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
                    echo "Unknown value for --ext: $2 (expected: cpp | ets | ts | ts_ets | all)" >&2
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
            echo "Unknown option: $1" >&2
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

# If arguments remain after "--", add them as paths
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

# Prepare report file
mkdir -p "$(dirname "$OUTPUT_FILE")"
echo "filename,line_number,length,text" > "$OUTPUT_FILE"

# Common awk script for finding long lines (uses max_len variable)
AWK_SCRIPT='BEGIN { PROCINFO["encoding"] = "utf-8" }
length($0) > max_len {
    sub(/^\xef\xbb\xbf/, "")
    line_len = length($0)
    gsub(/"/, "\"\"")
    printf "%s,%d,%d,\"%s\"\n", FILENAME, FNR, line_len, $0
}'

# Parse passed paths/patterns (ARGS already contains defaults if user didn't override them)
# shopt -s — enables Bash shell options.
# nullglob — patterns without matches expand to empty list (not remain as pattern string), to avoid passing "raw" patterns further.
# globstar — enables recursive glob **, allowing matching of nested directories.
shopt -s nullglob globstar

# Prepare find expression for extensions
FIND_NAME_EXPR=()
for __ext in "${DEFAULT_EXTENSIONS[@]}"; do
    if [[ ${#FIND_NAME_EXPR[@]} -gt 0 ]]; then
        FIND_NAME_EXPR+=( -o )
    fi
    FIND_NAME_EXPR+=( -name "$__ext" )
done
unset __ext

# First collect explicit files from passed arguments (after glob expansion)
FILES_TO_CHECK=()
DIRS_TO_SCAN=()

for arg in "${ARGS[@]}"; do
    # Expand shell patterns (if any)
    matches=( $arg )
    if [[ ${#matches[@]} -eq 0 ]]; then
        # If nothing matched, leave as is — might be path with spaces in quotes
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

# Run awk on explicit files, if any
if [[ ${#FILES_TO_CHECK[@]} -gt 0 ]]; then
    gawk -v max_len="$MAX_LENGTH" "$AWK_SCRIPT" "${FILES_TO_CHECK[@]}" >> "$OUTPUT_FILE"
fi

# For directories — use find with extension filter
for d in "${DIRS_TO_SCAN[@]}"; do
    find "$d" -type f \( "${FIND_NAME_EXPR[@]}" \) -exec gawk -v max_len="$MAX_LENGTH" "$AWK_SCRIPT" {} + >> "$OUTPUT_FILE"
done

# Count unique report lines (without header)
cut -d';' -f1 "$OUTPUT_FILE" | tail -n +2 | sort | uniq | wc -l
