
VM=$PANDA_SDK_PATH/linux_host_tools/bin/ark
STDLIB=$PANDA_SDK_PATH/ets/etsstdlib.abc

LD_LIBRARY_PATH="../../../runtime/native/bin:../../../runtime/native/bundled/panda:../../bundled/panda:../../library" $VM --load-runtimes=ets --boot-panda-files $STDLIB:./build/abc/src/program.abc:../../bundled/panda/raylib.abc:../../../runtime/native/bundled/panda/idlizer.runtime.native.abc ./build/abc/src/program.abc program.ETSGLOBAL::main
