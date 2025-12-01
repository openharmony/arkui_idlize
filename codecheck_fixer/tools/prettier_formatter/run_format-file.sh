#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DEFAULT_ARGS=(--file ./input.fixture.ts)

if [ "$#" -eq 0 ]; then
  ARGS=("${DEFAULT_ARGS[@]}")
else
  ARGS=("${DEFAULT_ARGS[@]}" "$@")
fi

npx ts-node ./format-file.ts "${ARGS[@]}" > ./output.fixture.ts