# #!/bin/bash
# set -e
# shopt -s globstar # to make **/*.abc recursive

# external_dir=../../../external
# arkts_dir=$external_dir/incremental/tools/panda/arkts
# out_dir=build/panda
# aot_bin="/home/wanzixuan/arkts/idlize/idlize_0306/idlize/external/incremental/tools/panda/node_modules/@panda/sdk/linux_host_tools/bin/ark_aot"

# bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc

# $aot_bin --boot-panda-files=/home/wanzixuan/arkts/idlize/idlize_0306/idlize/external/incremental/tools/panda/node_modules/@panda/sdk/ets/etsstdlib.abc:$bootfiles --paoc-panda-files $out_dir/app.abc --paoc-output $out_dir/app.an --load-runtimes=ets --paoc-use-cha=true

# LD_LIBRARY_PATH=$PWD/$out_dir $arkts_dir/ark --enable-an --aot-files=$out_dir/app.an $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point @mediaquery.src.panda.main.ETSGLOBAL::main

#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda
aot_bin="${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/linux_host_tools/bin/ark_aot"

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc

$aot_bin --boot-panda-files=${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/ets/etsstdlib.abc:$bootfiles --paoc-panda-files $out_dir/app.abc --paoc-panda-files $external_dir/interop/build/interop.abc --paoc-panda-files $external_dir/incremental/runtime/build/incremental.abc --paoc-output $out_dir/app.an --load-runtimes=ets --paoc-use-cha=true --compiler-dump

LD_LIBRARY_PATH=$PWD/$out_dir perf record -g --call-graph dwarf,8192 --event cycles:Pu --aio --sample-cpu  $arkts_dir/ark --enable-an --aot-files=$out_dir/app.an $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point @mediaquery.src.panda.main.ETSGLOBAL::main