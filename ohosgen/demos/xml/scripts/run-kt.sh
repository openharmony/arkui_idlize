#!/bin/bash
CWD=`pwd`
LD_LIBRARY_PATH="$CWD/build/kotlin":"$CWD/../../../external/interop/build" ACE_LIBRARY_PATH="$CWD/../../../external/arkoala-arkts/build" node $CWD/../../../external/arkoala-arkts/build/index.js kotlin:ComExampleTrivialApplication 10