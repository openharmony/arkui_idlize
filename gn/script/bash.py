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
from stamp import create_stamp_file


def parse_env_vars(env_args):
    """Parse environment variables from key=value pairs."""
    env_vars = {}
    for env_arg in env_args:
        if '=' in env_arg:
            key, value = env_arg.split('=', 1)
            env_vars[key] = value
        else:
            print(f"Warning: ignoring invalid environment variable format: {env_arg}")
    return env_vars

def run_bash_script(script_path, stamp_file, env_vars=None, script_args=None):
    """Run a bash script and create stamp file on success."""
    
    if not os.path.exists(script_path):
        print(f"Error: bash script not found: {script_path}")
        return False
    
    try:
        # Build command
        cmd = ["/bin/bash", script_path]
        if script_args:
            cmd.extend(script_args)
        
        # Prepare environment
        env = os.environ.copy()
        if env_vars:
            env.update(env_vars)
            print(f"Setting environment variables: {', '.join(env_vars.keys())}")
        
        print(f"Running: {' '.join(cmd)}")
        if env_vars:
            for key, value in env_vars.items():
                print(f"  {key}={value}")
        
        # Run bash script with environment
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        # Print stdout if any
        if result.stdout:
            print(result.stdout)
        
        if result.returncode != 0:
            print(f"bash script failed with exit code {result.returncode}")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
        
        # Create stamp file
        create_stamp_file(stamp_file)
            
        print(f"✓ bash script completed: {os.path.basename(script_path)}")
        return True
        
    except Exception as e:
        print(f"Error running bash script: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run a bash script')
    parser.add_argument('--bash-script', required=True, help='Path to bash script')
    parser.add_argument('--stamp', required=True, help='Stamp file path')
    parser.add_argument('--env', action='append', help='Environment variables (key=value)')
    
    # Parse known args first, then the rest go to script_args
    args, script_args = parser.parse_known_args()
    
    # Parse environment variables
    env_vars = {}
    if args.env:
        env_vars = parse_env_vars(args.env)
    
    # Filter out the '--' separator if present
    script_args = list(filter(lambda x: x != '--', script_args))
    
    success = run_bash_script(args.bash_script, args.stamp, env_vars, script_args)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()