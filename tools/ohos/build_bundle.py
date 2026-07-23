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

"""Build the OpenHarmony idlize npm bundle without modifying the source tree."""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile


NPM_REGISTRY = "https://repo.huaweicloud.com/repository/npm/"
IDLIZER_PACKAGES = {
    "@idlizer/arkgen",
    "@idlizer/core",
    "@idlizer/etsgen",
    "@idlizer/interfaces",
    "@idlizer/libohos",
    "@idlizer/runner",
}
KOALA_PACKAGES = {
    "@koalaui/common",
    "@koalaui/compat",
    "@koalaui/interop",
    "@koalaui/libarkts",
}
DEPENDENCY_FIELDS = (
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
)
BUNDLE_WORKSPACES = (
    "core",
    "interfaces",
    "libohos",
    "etsgen",
    "arkgen",
    "runner",
)
EXCLUDED_DIRECTORIES = {
    ".agents",
    ".codex",
    ".git",
    ".idea",
    ".rollup.cache",
    ".vscode",
    "absolute-sdk-patched-arkts",
    "build",
    "bundled",
    "external",
    "interface_sdk-js",
    "lib",
    "node_modules",
    "out",
    "sdk-patched",
    "sdk-patched-arkts",
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--bundle-out", required=True)
    parser.add_argument("--libarkts", required=True)
    parser.add_argument("--panda-sdk", required=True)
    parser.add_argument("--node-bin", required=True)
    parser.add_argument("--stamp", required=True)
    parser.add_argument("--depfile", required=True)
    parser.add_argument("--bundle-version", required=True)
    parser.add_argument("--koalaui-version", required=True)
    return parser.parse_args()


def ignored_files(directory, names):
    ignored = set()
    for name in names:
        path = Path(directory, name)
        if name in EXCLUDED_DIRECTORIES and path.is_dir():
            ignored.add(name)
        elif name == "package-lock.json" or name.endswith(".tgz"):
            ignored.add(name)
    return ignored


def source_files(source_root):
    files = []
    for current_root, directories, filenames in os.walk(source_root):
        directories[:] = sorted(
            name for name in directories if name not in EXCLUDED_DIRECTORIES
        )
        for filename in sorted(filenames):
            if filename == "package-lock.json" or filename.endswith(".tgz"):
                continue
            files.append(Path(current_root, filename).resolve())
    return files


def safe_extract(archive_path, destination):
    destination = destination.resolve()
    with tarfile.open(archive_path, "r:gz") as archive:
        for member in archive.getmembers():
            member_path = Path(member.name)
            if member_path.is_absolute() or ".." in member_path.parts:
                raise RuntimeError(f"Unsafe archive member: {member.name}")
            if member.issym() or member.islnk():
                raise RuntimeError(f"Archive links are not allowed: {member.name}")
            extracted_path = (destination / member_path).resolve()
            if destination != extracted_path and destination not in extracted_path.parents:
                raise RuntimeError(f"Archive member escapes destination: {member.name}")
        archive.extractall(destination)


def archive_package_json(archive_path):
    with tarfile.open(archive_path, "r:gz") as archive:
        package_file = archive.extractfile("package/package.json")
        if package_file is None:
            raise RuntimeError(f"package/package.json is missing from {archive_path}")
        return json.load(package_file)


def prepare_install_manifests(work_dir, local_archive):
    manifest_paths = [work_dir / "package.json"] + [
        work_dir / workspace / "package.json" for workspace in BUNDLE_WORKSPACES
    ]
    snapshots = {
        manifest: manifest.read_text(encoding="utf-8") for manifest in manifest_paths
    }

    root_package = json.loads(snapshots[work_dir / "package.json"])
    root_package["workspaces"] = list(BUNDLE_WORKSPACES)
    (work_dir / "package.json").write_text(
        json.dumps(root_package, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Koala-only development helpers are not needed to compile the six idlizer
    # packages and older pinned versions are not available from the OHOS npm
    # mirror. Keep them in the package metadata, but omit them during install.
    for workspace in BUNDLE_WORKSPACES:
        manifest = work_dir / workspace / "package.json"
        package = json.loads(manifest.read_text(encoding="utf-8"))
        dev_dependencies = package.get("devDependencies", {})
        package["devDependencies"] = {
            name: version
            for name, version in dev_dependencies.items()
            if not name.startswith("@koalaui/")
        }
        if workspace == "etsgen":
            package["dependencies"]["@koalaui/libarkts"] = (
                f"file:../{local_archive.relative_to(work_dir).as_posix()}"
            )
        manifest.write_text(
            json.dumps(package, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return snapshots


def restore_manifests(snapshots):
    for manifest, contents in snapshots.items():
        manifest.write_text(contents, encoding="utf-8")


def run(command, cwd, env):
    print("Running:", " ".join(str(item) for item in command), flush=True)
    subprocess.run(command, cwd=cwd, env=env, check=True)


def find_installed_libarkts(work_dir):
    candidates = (
        work_dir / "node_modules" / "@koalaui" / "libarkts" / "package.json",
        work_dir / "etsgen" / "node_modules" / "@koalaui" / "libarkts" / "package.json",
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise RuntimeError("The local @koalaui/libarkts package was not installed")


def contains_external_file_reference(value):
    if isinstance(value, str):
        normalized = value.replace("\\", "/")
        return normalized.startswith("file:") and "/external/" in f"/{normalized}"
    if isinstance(value, dict):
        return any(contains_external_file_reference(item) for item in value.values())
    if isinstance(value, list):
        return any(contains_external_file_reference(item) for item in value)
    return False


def validate_bundle(bundle_out, bundle_version, koalaui_version):
    entries = sorted(bundle_out.iterdir(), key=lambda path: path.name)
    archives = [path for path in entries if path.suffix == ".tgz"]
    if len(entries) != 6 or len(archives) != 6:
        raise RuntimeError(
            f"Unexpected bundle contents: {', '.join(path.name for path in entries)}"
        )

    package_names = set()
    for archive in archives:
        package = archive_package_json(archive)
        package_names.add(package.get("name"))
        if package.get("version") != bundle_version:
            raise RuntimeError(
                f"{archive.name} has version {package.get('version')}, expected {bundle_version}"
            )
        if contains_external_file_reference(package):
            raise RuntimeError(f"{archive.name} contains an external file dependency")
        for field in DEPENDENCY_FIELDS:
            for name, version in package.get(field, {}).items():
                if name in IDLIZER_PACKAGES and version != bundle_version:
                    raise RuntimeError(
                        f"{archive.name}: {name} is {version}, expected {bundle_version}"
                    )
                if name in KOALA_PACKAGES and version != koalaui_version:
                    raise RuntimeError(
                        f"{archive.name}: {name} is {version}, expected {koalaui_version}"
                    )
    if package_names != IDLIZER_PACKAGES:
        raise RuntimeError(f"Unexpected package set: {sorted(package_names)}")


def ninja_escape(path):
    return str(path).replace("$", "$$").replace(" ", "$ ").replace(":", "$:")


def write_depfile(depfile, stamp, inputs):
    depfile.parent.mkdir(parents=True, exist_ok=True)
    dependencies = " ".join(ninja_escape(path) for path in sorted(set(inputs)))
    depfile.write_text(f"{ninja_escape(stamp)}: {dependencies}\n", encoding="utf-8")


def validate_mutable_paths(source_root, paths):
    for path in paths:
        if path == Path(path.anchor) or path == source_root or source_root in path.parents:
            raise RuntimeError(f"Refusing to modify unsafe path: {path}")
    for index, path in enumerate(paths):
        for other in paths[index + 1 :]:
            if path == other or path in other.parents or other in path.parents:
                raise RuntimeError(f"Mutable paths overlap: {path} and {other}")


def main():
    args = parse_args()
    source_root = Path(args.source_root).resolve()
    work_dir = Path(args.work_dir).resolve()
    bundle_out = Path(args.bundle_out).resolve()
    libarkts = Path(args.libarkts).resolve()
    panda_sdk = Path(args.panda_sdk).resolve()
    node_bin = Path(args.node_bin).resolve()
    stamp = Path(args.stamp).resolve()
    depfile = Path(args.depfile).resolve()

    validate_mutable_paths(source_root, (work_dir, bundle_out, stamp, depfile))

    for required in (source_root / "package.json", libarkts, panda_sdk, node_bin / "npm"):
        if not required.exists():
            raise FileNotFoundError(required)

    tracked_sources = source_files(source_root)
    shutil.rmtree(work_dir, ignore_errors=True)
    shutil.rmtree(bundle_out, ignore_errors=True)
    stamp.unlink(missing_ok=True)
    work_dir.parent.mkdir(parents=True, exist_ok=True)
    bundle_out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source_root, work_dir, ignore=ignored_files)

    dependency_dir = work_dir / ".ohos-deps"
    dependency_dir.mkdir()
    local_libarkts = dependency_dir / "libarkts.tgz"
    shutil.copy2(libarkts, local_libarkts)
    manifest_snapshots = prepare_install_manifests(work_dir, local_libarkts)

    panda_dir = dependency_dir / "panda-sdk"
    panda_dir.mkdir()
    safe_extract(panda_sdk, panda_dir)
    panda_sdk_path = panda_dir / "sdk"
    if not (panda_sdk_path / "package.json").is_file():
        raise RuntimeError(f"Invalid Panda SDK archive: {panda_sdk}")

    env = os.environ.copy()
    env["PATH"] = str(node_bin) + os.pathsep + env.get("PATH", "")
    env["PANDA_SDK_PATH"] = str(panda_sdk_path)
    env["IDLIZE_BUNDLE_OUT"] = str(bundle_out)
    env["npm_config_registry"] = NPM_REGISTRY

    npm = node_bin / "npm"
    run(
        [
            npm,
            "install",
            "--registry",
            NPM_REGISTRY,
            "--no-package-lock",
            "--no-audit",
            "--no-fund",
        ],
        work_dir,
        env,
    )
    restore_manifests(manifest_snapshots)

    archive_libarkts_version = archive_package_json(local_libarkts).get("version")
    installed_libarkts = json.loads(
        find_installed_libarkts(work_dir).read_text(encoding="utf-8")
    )
    if installed_libarkts.get("version") != archive_libarkts_version:
        raise RuntimeError(
            "npm did not install the libarkts archive supplied by ace_ets2bundle"
        )

    run([npm, "run", "bundle"], work_dir, env)
    validate_bundle(bundle_out, args.bundle_version, args.koalaui_version)

    stamp.parent.mkdir(parents=True, exist_ok=True)
    stamp.write_text("idlize bundle complete\n", encoding="utf-8")
    write_depfile(depfile, Path(args.stamp), [*tracked_sources, libarkts, panda_sdk])


if __name__ == "__main__":
    main()
