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

import argparse
import os
import subprocess
import sys

def run_node_script(script_path, stamp_file, script_args=None):
    """Run a Node.js script and create stamp file on success."""
    
    if not os.path.exists(script_path):
        print(f"Error: Node script not found: {script_path}")
        return False
    
    try:
        # Build command
        cmd = ["node", script_path]
        if script_args:
            cmd.extend(script_args)
        
        print(f"Running: {' '.join(cmd)}")
        
        # Run Node.js script
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Print stdout if any
        if result.stdout:
            print(result.stdout)
        
        if result.returncode != 0:
            print(f"Node script failed with exit code {result.returncode}")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
        
        # Create stamp file
        os.makedirs(os.path.dirname(stamp_file), exist_ok=True)
        with open(stamp_file, 'w'):
            pass
            
        print(f"✓ Node script completed: {os.path.basename(script_path)}")
        return True
        
    except Exception as e:
        print(f"Error running Node script: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run a Node.js script')
    parser.add_argument('--node-script', required=True, help='Path to Node.js script')
    parser.add_argument('--stamp', required=True, help='Stamp file path')
    
    # Parse known args first, then the rest go to script_args
    args, script_args = parser.parse_known_args()
    
    success = run_node_script(args.node_script, args.stamp, filter(lambda x: x != '--', script_args))
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()