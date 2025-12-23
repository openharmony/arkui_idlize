#!/bin/bash
set -e

rm -rf out
npm run build
# Запускаем форматирование C/C++ через встроенную команду cpp-format, пишем результат в out/fixed
REPO_ROOT="/data/home/mlobakh/BZ_OHOS/OHOS"
CPP_PATHS=(
  "foundation/arkui/ace_engine/frameworks/bridge/arkts_frontend/koala_projects/arkoala-arkts/framework/native/src/generated"
  "foundation/arkui/ace_engine/frameworks/core/interfaces/native/generated"
  "foundation/arkui/ace_engine/frameworks/core/interfaces/native/implementation"
)

/bin/bash run.sh cpp-format \
  -c config.json \
  --repo "$REPO_ROOT" \
  --cpp "${CPP_PATHS[@]}" \
  --verbose \
  --output out/fixed

cd out/fixed

echo "filename,line_number,length,text" > long_lines.csv
find "$(pwd)" -type f \( -name "*.cpp" -o -name "*.cc" -o -name "*.cxx" -o -name "*.c++" -o -name "*.hpp" -o -name "*.h" \) -exec gawk '
BEGIN { PROCINFO["encoding"] = "utf-8" }
length($0) > 120 {
    sub(/^\xef\xbb\xbf/, "")
    line_len = length($0)
    gsub(/"/, "\"\"")
    printf "%s,%d,%d,\"%s\"\n", FILENAME, FNR, line_len, $0
}' {} + >> long_lines.csv

cut -d';' -f1 long_lines.csv | tail -n +2 | sort | uniq | wc -l

cd -