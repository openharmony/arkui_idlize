#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
LD_LIBRARY_PATH="$SCRIPT_DIR/../build/kotlin":"$SCRIPT_DIR/../../../../external/koala_projects/interop/build" build/kotlin/unit.kexe
