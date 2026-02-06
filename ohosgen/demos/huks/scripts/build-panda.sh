#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

npx smart-arkts compile --config arktsconfig.json
