#!/bin/bash

# Copyright (c) 2024-2025 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# $1 - filePath to save patch
# $2 - search path (file or directory or multiple)

curDir="$(pwd)"
rootDir="$(git rev-parse --show-toplevel)"

patchFile=${1:-$curDir"/patches/clang-format.patch"}
patchFile=$(readlink -m $patchFile)
> $patchFile

searchDir=($@)
searchDir=${searchDir[@]:1}
searchDir=$(readlink -m $searchDir)

cd $rootDir
searchDir=$(realpath -m --relative-to=$rootDir $searchDir)
echo "Search paths: "$searchDir
files=($(find $searchDir -type f -iname '*.h' -o -iname '*.cc'))

# find idlize-copy/external/arkoala-arkts/ \( \( -iname '*.h' -or -iname '*.cc' \) -and -not -path "*/node_modules/*" -and -not -path "*/tools/*" \)

for file in ${files[*]}
do 
    fileCopy=$file".copy"
    cp $file $fileCopy
    echo "Checking clang format: "$file
    clang-format $fileCopy --style=file -i
    git diff --no-index $file $fileCopy >> $patchFile
    sed -i "s|$fileCopy|$file|g" $patchFile
    rm $fileCopy
done
cd $curDir

echo "Patch saved: "$patchFile

