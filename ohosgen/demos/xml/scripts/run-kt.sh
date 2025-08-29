#!/bin/bash
CWD=`pwd`
LD_LIBRARY_PATH="$CWD/build/kotlin":"$CWD/../../../external/interop/build" build/kotlin/xml-demo.kexe
