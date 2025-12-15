#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
LD_LIBRARY_PATH="$SCRIPT_DIR/../build/kotlin":"$SCRIPT_DIR/../../../../external/interop/build" build/kotlin/xml-demo.kexe
