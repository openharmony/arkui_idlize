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
Collects files matching glob patterns and writes a depfile.
Updates a marker file with a timestamp.
"""

import argparse
import glob
import os


def match_sources(patterns):
    files = set()
    for pattern in patterns:
        matches = glob.glob(pattern, recursive=True)
        for m in matches:
            if os.path.isfile(m):
                files.add(m)
    return sorted(files)


def write_depfile(depfile, output_file, deps):
    with open(depfile, 'w') as output:
        output.write(f'{output_file}:')
        for dep in deps:
            output.write(f' {dep}')
        output.write('\n')


def main():
    parser = argparse.ArgumentParser(
        description='Collect files matching glob patterns and write a depfile'
    )
    parser.add_argument('--source', action='append', default=[],
                        help='Glob pattern to match files (repeatable)')
    parser.add_argument('--marker', help='Marker file to update')
    parser.add_argument('--depfile', help='Depfile path')
    args = parser.parse_args()

    matched_files = match_sources(args.source)

    write_depfile(args.depfile, args.marker, matched_files)
    with open(args.marker, 'w') as output:
        for f in matched_files:
            output.write(f + '\n')


if __name__ == '__main__':
    main()
