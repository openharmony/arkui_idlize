/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

/**
 * Minimal sync glob expander: * (one segment) and ** (recursive).
 * No external dependencies; matches patterns used in rimraf scripts.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Convert a single path segment pattern to a RegExp.
 * * matches any characters except path separator.
 */
function segmentRegex(seg) {
  const escaped = seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
}

/**
 * Walk directory tree recursively according to glob pattern parts.
 * @param {string} dir - Current directory
 * @param {number} segIdx - Current segment index in parts
 * @param {string[]} parts - Glob pattern parts
 * @param {string} cwd - Current working directory
 * @param {string[]} results - Accumulated results
 */
function walk(dir, segIdx, parts, cwd, results) {
  if (segIdx >= parts.length) {
    const rel = path.relative(cwd, dir);
    results.push(rel || '.');
    return;
  }
  const seg = parts[segIdx];
  if (seg === '**') {
    walk(dir, segIdx + 1, parts, cwd, results);
    const entries = readDirectoryEntries(dir);
    for (const e of entries) {
      if (!e.isDirectory() || e.name === '.' || e.name === '..') {
        continue;
      }
      walk(path.join(dir, e.name), segIdx, parts, cwd, results);
    }
    return;
  }
  const hasStar = seg.includes('*');
  if (!hasStar) {
    const nextDir = path.join(dir, seg);
    if (existsSync(nextDir)) {
      walk(nextDir, segIdx + 1, parts, cwd, results);
    }
    return;
  }
  const entries = readDirectoryEntries(dir);
  const re = segmentRegex(seg);
  for (const e of entries) {
    if (re.test(e.name)) {
      walk(path.join(dir, e.name), segIdx + 1, parts, cwd, results);
    }
  }
}

/**
 * Safely read directory entries, ignoring errors.
 * @param {string} dir - Directory to read
 * @returns {fs.Dirent[]} Array of directory entries
 */
function readDirectoryEntries(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * Safely check if path exists, ignoring errors.
 * @param {string} path - Path to check
 * @returns {boolean} True if path exists
 */
function existsSync(path) {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

/**
 * Expand one glob pattern from cwd. Returns paths relative to cwd.
 * Supports * in segments and ** as a segment (zero or more path segments).
 */
export function globSync(pattern, cwd = process.cwd()) {
  const normalized = path.normalize(pattern);
  const isAbsolute = path.isAbsolute(normalized);
  const root = path.parse(normalized).root;
  const parts = (isAbsolute ? normalized.slice(root.length) : normalized)
    .split(path.sep)
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return [];
  }
  const results = [];
  const startDir = isAbsolute ? root : cwd;
  walk(startDir, 0, parts, cwd, results);
  return results;
}
