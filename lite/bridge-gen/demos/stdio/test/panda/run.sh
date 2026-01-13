
VM=$PANDA_SDK_PATH/linux_host_tools/bin/ark
STDLIB=$PANDA_SDK_PATH/ets/etsstdlib.abc

$VM --load-runtimes=ets --boot-panda-files $STDLIB:./build/abc/src/test.abc:../../bundled/panda/stdio.abc ./build/abc/src/test.abc test.ETSGLOBAL::main
