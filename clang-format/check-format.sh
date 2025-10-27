#!/bin/bash

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
files=($(find $searchDir -type f -iname '*.h' -o -iname '*.cpp'))

# find idlize-copy/external/arkoala-arkts/ \( \( -iname '*.h' -or -iname '*.cpp' \) -and -not -path "*/node_modules/*" -and -not -path "*/tools/*" \)

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

