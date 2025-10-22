#!/bin/bash

# $1 - search path (file or directory or multiple)

curDir="$(pwd)"
rootDir="$(git rev-parse --show-toplevel)"

mkfile() { mkdir -p "$(dirname "$1")" && touch "$1" ;  }

patchFile="./patches/clang-format.patch"
patchFile=$(readlink -m $patchFile)
mkfile $patchFile
> $patchFile

searchDir=($@)
searchDir=${searchDir[@]:0}
searchDir=$(readlink -m $searchDir)

cd $rootDir
searchDir=$(realpath -m --relative-to=$rootDir $searchDir)
echo "Search paths: "$searchDir
files=($(find $searchDir -not -iname "*.ttf.cc" -and -type f -and \( -iname '*.h' -or -iname '*.cpp' \)))

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
