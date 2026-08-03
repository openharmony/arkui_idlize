#!/usr/bin/env python
# -*- coding: utf-8 -*-
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
import glob
import json
import shutil
import subprocess
import os
import sys

NPM_REPO = "https://repo.huaweicloud.com/repository/npm/"

parser = argparse.ArgumentParser(description="npm command parser")
parser.add_argument("--project-path", help="project directory in koala repo")
parser.add_argument("--node-path", help="nodejs path")
parser.add_argument("--arklink-path", help="ark-link path")
parser.add_argument("--es2panda-path", help="es2panda path")
parser.add_argument("--stdlib-path", help="stdlib path")
parser.add_argument("--target-out-path", help="out directory of built target")
parser.add_argument("--built-file-path", help="result of building")
parser.add_argument("--install", action="store_true", help="request npm install")
parser.add_argument("--install-override", action="append", default=[],
                    help="package name:version override (repeatable)")
parser.add_argument("--install-path", help="path to install in")
parser.add_argument("--install-depfile", help="depfile path to write after install")
parser.add_argument("--install-depfile-target", help="output target for depfile")
parser.add_argument("--run-tasks", nargs='+', help="npm run tasks")
parser.add_argument("--panda-sdk-path", help="panda sdk path")

args = parser.parse_args()

project_path = args.project_path
koala_log = os.path.join(project_path, "koala_build.log")

koala_node_path = args.node_path or (os.path.dirname(shutil.which("node")) if shutil.which("node") else None)
if koala_node_path:
    os.environ["PATH"] = f"{koala_node_path}:{os.environ.get('PATH', '')}"
else:
    print("Error: Node.js is not found in the system PATH, and --node-path is not provided")
    sys.exit(1)

if args.es2panda_path:
    os.environ["ES2PANDA_PATH"] = args.es2panda_path
if args.arklink_path:
    os.environ["ARKLINK_PATH"] = args.arklink_path
if args.stdlib_path:
    os.environ["ETS_STDLIB_PATH"] = args.stdlib_path
if args.panda_sdk_path:
    os.environ["PANDA_SDK_PATH"] = args.panda_sdk_path
# Note: os.environ["PANDA_SDK_PATH"] = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../ui2abc/build/sdk")

def run(args_list, dir = None):
    cwd = os.getcwd()
    try:
        os.chdir(dir or project_path)

        if os.environ.get("KOALA_LOG_STDOUT"):
            subprocess.run(["npm"] + args_list, env=os.environ, text=True, check=True, stderr=subprocess.STDOUT)
            return
        result = subprocess.run(["npm"] + args_list, capture_output=True, env=os.environ, text=True)
        with open(koala_log, "w+") as f:
            f.write(f"npm args: {args_list}; project: {project_path}:\n" + result.stdout)
            if result.returncode != 0:
                f.write(f"npm args: {args_list}; project: {project_path}:\n" + result.stderr)
                f.close()
                with open(koala_log, "r") as log_file:
                    print(log_file.read())
                raise Exception("npm failed")
            f.close()
    finally:
        os.chdir(cwd)

def clean_workspace(root):
    for nm in glob.glob(os.path.join(root, '**', 'node_modules'), recursive=True):
        if os.path.isdir(nm):
            shutil.rmtree(nm, ignore_errors=True)
    for pl in glob.glob(os.path.join(root, '**', 'package-lock.json'), recursive=True):
        if os.path.isfile(pl):
            os.remove(pl)


def collect_package_jsons(install_dir):
    pkgs = [os.path.join(install_dir, 'package.json')]
    root_pkg_path = pkgs[0]
    if os.path.exists(root_pkg_path):
        with open(root_pkg_path, 'r') as f:
            root = json.load(f)
        workspaces = root.get('workspaces')
        if workspaces:
            patterns = workspaces if isinstance(workspaces, list) else workspaces.get('packages', [])
            for pattern in patterns:
                ws_glob = os.path.join(install_dir, pattern, 'package.json')
                for match in glob.glob(ws_glob, recursive=True):
                    if os.path.isfile(match) and match not in pkgs:
                        pkgs.append(match)
    return sorted(pkgs)


def write_depfile(depfile_path, target, deps):
    with open(depfile_path, 'w') as f:
        f.write(f'{target}:')
        for dep in deps:
            f.write(f' {dep}')
        f.write('\n')


def apply_overrides(install_dir, overrides):
    package_json = os.path.join(install_dir, 'package.json')
    backup_json = package_json + '.backup'

    shutil.copy2(package_json, backup_json)

    with open(package_json, 'r') as f:
        pkg = json.load(f)

    overrides_dict = {}
    for ov in overrides:
        name, version = ov.split(':', 1)
        overrides_dict[name] = version
    pkg['overrides'] = overrides_dict

    with open(package_json, 'w') as f:
        json.dump(pkg, f, indent=2)
        f.write('\n')

    return backup_json


def restore_package_json(backup_path):
    shutil.move(backup_path, backup_path.replace('.backup', ''))


def install(dir = None):
    run(["install", "--registry", NPM_REPO, "--verbose"], dir or project_path)


def install_with_overrides(install_dir, overrides):
    clean_workspace(project_path)
    backup = apply_overrides(install_dir, overrides)
    try:
        install(install_dir)
    finally:
        restore_package_json(backup)

def copy_target():
    if not os.path.exists(args.built_file_path):
        print(f"Error: Built file not found at {args.built_file_path}")
        sys.exit(1)
    shutil.copy(args.built_file_path, args.target_out_path)

def main():
    if args.install:
        install_dir = args.install_path or project_path
        if args.install_override:
            install_with_overrides(install_dir, args.install_override)
        else:
            install(install_dir)
        if args.install_depfile:
            pkgs = collect_package_jsons(install_dir)
            write_depfile(args.install_depfile, args.install_depfile_target, pkgs)
    if args.run_tasks:
        for task in args.run_tasks:
            run(["run", task])
    if args.target_out_path and args.built_file_path:
        copy_target()

if __name__ == '__main__':
    main()    
