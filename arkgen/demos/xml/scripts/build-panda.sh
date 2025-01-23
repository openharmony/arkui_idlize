#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

$arkts_dir/arktsc --arktsconfig arktsconfig.json --ets-module
$arkts_dir/arktsc --arktsconfig arktsconfig.main.json
$arkts_dir/arklink --output $out_dir/app.abc -- $out_dir/out/**/*.abc
