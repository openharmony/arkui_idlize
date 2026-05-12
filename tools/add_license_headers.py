#!/usr/bin/env python3
"""
Add Apache-2.0 license/copyright headers to source files that are missing them.

Usage:
    python3 tools/add_license_headers.py [--dry-run] [--repo-path PATH]

Flags:
    --dry-run       Show what would be changed without modifying files.
    --repo-path     Root of the repository (default: script's parent's parent).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Sequence

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Copyright line used in every header.
COPYRIGHT_LINE = "Copyright (c) 2024-2025 Huawei Device Co., Ltd."

# Substrings that indicate an existing license header – if any of these are
# found in the first ~2 KB of the file we skip it.
EXISTING_LICENSE_MARKERS = (
    "Apache License",
    "Licensed under the Apache",
)

# Path fragments that identify generated / golden output directories.
# A file whose *relative* path (from repo root) contains any of these is
# skipped entirely.
GENERATED_PATH_FRAGMENTS = (
    "arkgen/tests/golden/",
    "ohosgen/tests/",
    "arkgen/ohos-app/api_perf/hvigor/",
)

# File extensions / names that should never be processed.
BINARY_EXTENSIONS: frozenset[str] = frozenset(
    [
        ".png",
        ".zip",
        ".lock",
        ".npmrc",
        ".csv",
        ".dot",
        ".sts",
        ".woff2",
    ]
)

# Special-format files that are always skipped.
SPECIAL_SKIP_NAMES: frozenset[str] = frozenset(
    [
        ".gitmodules",
        "VERSION",
    ]
)

# Maximum number of bytes to read when checking for an existing header.
_PEEK_SIZE = 2048

# ---------------------------------------------------------------------------
# Header templates
# ---------------------------------------------------------------------------

BLOCK_COMMENT_HEADER = f"""\
/*
 * {COPYRIGHT_LINE}
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"""

HASH_COMMENT_HEADER = f"""\
# {COPYRIGHT_LINE}
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""

# ---------------------------------------------------------------------------
# Extension-to-header mapping
# ---------------------------------------------------------------------------

# Extensions that use /* */ block comments.
_BLOCK_EXTENSIONS: frozenset[str] = frozenset(
    [
        ".c",
        ".cc",
        ".cpp",
        ".h",
        ".java",
        ".ts",
        ".js",
        ".mjs",
        ".ets",
        ".kt",
        ".idl",
        ".cj",
    ]
)

# Extensions / filenames that use # line comments.
_HASH_EXTENSIONS: frozenset[str] = frozenset(
    [
        ".sh",
        ".toml",
    ]
)
_HASH_NAMES: frozenset[str] = frozenset(
    [
        "Dockerfile",
    ]
)

# All source extensions we care about (union of the above).
_SOURCE_EXTENSIONS = _BLOCK_EXTENSIONS | _HASH_EXTENSIONS


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _is_binary_extension(path: Path) -> bool:
    return path.suffix.lower() in BINARY_EXTENSIONS


def _is_special_skip(path: Path) -> bool:
    return path.name in SPECIAL_SKIP_NAMES


def _is_generated(rel_path: str) -> bool:
    """Return True if *rel_path* (forward-slash normalised) is under a
    generated-output directory."""
    normalised = rel_path.replace(os.sep, "/")
    for frag in GENERATED_PATH_FRAGMENTS:
        if frag in normalised:
            return True
    return False


def _header_for(path: Path) -> str | None:
    """Return the appropriate header string for *path*, or ``None`` if the
    file type is not recognised."""
    if path.name in _HASH_NAMES:
        return HASH_COMMENT_HEADER
    suffix = path.suffix.lower()
    if suffix in _BLOCK_EXTENSIONS:
        return BLOCK_COMMENT_HEADER
    if suffix in _HASH_EXTENSIONS:
        return HASH_COMMENT_HEADER
    return None


def _has_existing_license(content_start: str) -> bool:
    """Check the beginning of a file for an existing license marker."""
    return any(marker in content_start for marker in EXISTING_LICENSE_MARKERS)


def _starts_with_bom(raw: bytes) -> tuple[bool, int]:
    """Detect a UTF-8 BOM and return (has_bom, bom_length)."""
    if raw[:3] == b"\xef\xbb\xbf":
        return True, 3
    return False, 0


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def _should_process(rel_path: str, path: Path) -> bool:
    """Decide whether *path* (with *rel_path* relative to repo root) should be
    considered for header injection."""
    if _is_binary_extension(path):
        return False
    if _is_special_skip(path):
        return False
    if _is_generated(rel_path):
        return False
    # node_modules should never be touched.
    if "node_modules" in rel_path:
        return False
    if _header_for(path) is None:
        return False
    return True


def _add_header(
    filepath: Path,
    *,
    dry_run: bool,
) -> bool:
    """Add a license header to *filepath*.  Return ``True`` if the file was
    (or would be) modified."""

    raw = filepath.read_bytes()

    # Detect BOM so we can preserve it.
    has_bom, bom_len = _starts_with_bom(raw)
    content_start = raw[bom_len : bom_len + _PEEK_SIZE].decode(
        errors="replace"
    )

    if _has_existing_license(content_start):
        return False

    header = _header_for(filepath)
    if header is None:
        return False

    # Handle shebang: for shell scripts (and anything starting with #!)
    # insert the header *after* the shebang line.
    text = raw.decode(errors="replace")
    shebang_line = ""
    body_offset = 0

    if text.startswith("#!"):
        newline_pos = text.find("\n")
        if newline_pos == -1:
            # Entire file is a single shebang line – just append header.
            shebang_line = text
            body_offset = len(text)
        else:
            shebang_line = text[: newline_pos + 1]
            body_offset = newline_pos + 1

    bom_prefix = b"\xef\xbb\xbf" if has_bom else b""

    if shebang_line:
        new_content = (
            bom_prefix
            + shebang_line.encode()
            + "\n".encode()
            + header.encode()
            + text[body_offset:].encode()
        )
    else:
        new_content = bom_prefix + header.encode() + text.encode()

    if dry_run:
        print(f"  [DRY-RUN] would add header: {filepath}")
    else:
        filepath.write_bytes(new_content)

    return True


def collect_source_files(repo_root: Path) -> list[Path]:
    """Walk the repository and return a sorted list of source file paths."""
    source_files: list[Path] = []
    for dirpath, _dirnames, filenames in os.walk(repo_root):
        dir_path = Path(dirpath)
        for fname in filenames:
            filepath = dir_path / fname
            rel_path = str(filepath.relative_to(repo_root))
            if _should_process(rel_path, filepath):
                source_files.append(filepath)
    source_files.sort()
    return source_files


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Add Apache-2.0 license headers to source files missing them."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Show what would be changed without modifying files.",
    )
    parser.add_argument(
        "--repo-path",
        default=None,
        help=(
            "Root of the repository "
            "(default: parent directory of this script's location)."
        ),
    )
    args = parser.parse_args(argv)

    if args.repo_path:
        repo_root = Path(args.repo_path).resolve()
    else:
        # Default: two levels up from this script -> project root.
        repo_root = Path(__file__).resolve().parent.parent

    if not repo_root.is_dir():
        print(f"Error: repo root does not exist: {repo_root}", file=sys.stderr)
        return 1

    print(f"Scanning: {repo_root}")
    source_files = collect_source_files(repo_root)
    print(f"Found {len(source_files)} candidate source file(s).\n")

    modified = 0
    for filepath in source_files:
        if _add_header(filepath, dry_run=args.dry_run):
            modified += 1

    if args.dry_run:
        print(f"\n[DRY-RUN] {modified} file(s) would be modified.")
    else:
        print(f"\nDone. {modified} file(s) modified.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
