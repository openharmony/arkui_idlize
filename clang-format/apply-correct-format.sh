#!/bin/bash

# $1 - filePath to patch (default - `./patches/clang-format.patch`)

patchFile=${1:-$curDir"/patches/clang-format.patch"}
patchFile=$(readlink -m $patchFile)

curDir="$(pwd)"
rootDir="$(git rev-parse --show-toplevel)"

cd $rootDir

echo "Try to apply patch: "$patchFile
git apply --stat --apply --unsafe-paths --verbose $patchFile

cd $curDir