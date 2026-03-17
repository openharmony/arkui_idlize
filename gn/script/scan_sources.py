#!/usr/bin/env python3

# Copyright (c) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Checks that directory content specified in input file is actual.
Updates it if necessary.
"""

import argparse
import os
import time

def traverse(dir_path):
    file_lst = []
    for root, _, files in os.walk(dir_path):
        file_lst += [os.path.join(root, file) for file in files]
    return sorted(file_lst)

def write_depfile(depfile, output_file, deps):
    with open(depfile, 'w') as output:
        output.write(f'{output_file}:')
        for dep in deps:
            output.write(f' {dep}')
        output.write('\n')


def main():
    parser = argparse.ArgumentParser(
        description='Walk over directory recursively and output file paths'
    )
    parser.add_argument('--dir', help='Directory to walk over')
    parser.add_argument('--marker', help='Marker file to update')
    parser.add_argument('--depfile', help='Depfile path')
    args = parser.parse_args()
    dir_content = traverse(args.dir)
    write_depfile(args.depfile, args.marker, dir_content)
    with open(args.marker, 'w') as output:
        output.write(str(time.time()))

if __name__ == '__main__':
    main()
