
COMPILER=$PANDA_SDK_PATH/linux_host_tools/bin/es2panda
STDLIB=$PANDA_SDK_PATH/ets/stdlib

$COMPILER --stdlib $STDLIB --extension ets --arktsconfig arktsconfig.json
