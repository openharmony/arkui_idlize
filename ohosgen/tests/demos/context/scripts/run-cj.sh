#!/bin/bash
LD_LIBRARY_PATH=./build/native/cangjie/:$LD_LIBRARY_PATH && cjpm run
