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

import fs from "node:fs";
import path from "node:path";

/**
 * Convert a single path segment pattern to a RegExp.
 * * matches any characters except path separator.
 */
function segmentRegex(seg) {
  const escaped = seg.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
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

  function walk(dir, segIdx) {
    if (segIdx >= parts.length) {
      const rel = path.relative(cwd, dir);
      results.push(rel || ".");
      return;
    }
    const seg = parts[segIdx];
    if (seg === "**") {
      walk(dir, segIdx + 1);
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory() && e.name !== "." && e.name !== "..") {
            walk(path.join(dir, e.name), segIdx);
          }
        }
      } catch {
        // ignore ENOENT etc.
      }
      return;
    }
    const hasStar = seg.includes("*");
    if (!hasStar) {
      const nextDir = path.join(dir, seg);
      try {
        if (fs.existsSync(nextDir)) {
          walk(nextDir, segIdx + 1);
        }
      } catch {
        // ignore
      }
      return;
    }
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const re = segmentRegex(seg);
      for (const e of entries) {
        if (re.test(e.name)) {
          walk(path.join(dir, e.name), segIdx + 1);
        }
      }
    } catch {
      // ignore
    }
  }

  walk(startDir, 0);
  return results;
}
