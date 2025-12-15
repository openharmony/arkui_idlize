#!/usr/bin/env python3

# Copyright (c) 2025 Huawei Device Co., Ltd.
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
Stamp file creator for build systems.
Creates or updates an empty .stamp file at the specified path.
"""

import os
import sys
import argparse

def create_stamp_file(stamp_file_path):
    try:
        # Ensure the parent directory exists
        parent_dir = os.path.dirname(stamp_file_path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        
        # Create or update the stamp file (empty)
        with open(stamp_file_path, 'w'):
            pass  # Empty file
        
        print(f"Created/updated stamp file: {stamp_file_path}")
        return True
        
    except Exception as e:
        print(f"Error creating stamp file: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Create or update an empty .stamp file at the specified path'
    )
    parser.add_argument(
        'stamp_file',
        help='Full path to the .stamp file to be created'
    )
    
    args = parser.parse_args()
    
    # Exit with error code if failed
    if not create_stamp_file(args.stamp_file):
        sys.exit(1)

if __name__ == '__main__':
    main()