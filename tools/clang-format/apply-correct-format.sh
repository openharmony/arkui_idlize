#!/bin/bash

# $1 - search path (file or directory or multiple)

curDir="$(pwd)"
rootDir="$(git rev-parse --show-toplevel)"

searchDir=($@)
searchDir=${searchDir[@]:0}
searchDir=$(readlink -m $searchDir)

cd $rootDir
searchDir=$(realpath -m --relative-to=$rootDir $searchDir)
echo "Search paths: "$searchDir
files=($(find $searchDir -not -iname "*.ttf.cc" -and -type f -and \( -iname '*.h' -or -iname '*.cc' \)))

for file in ${files[*]}
do 
    echo "Applying clang format: "$file
    clang-format $file --style=file -i
done
cd $curDir
