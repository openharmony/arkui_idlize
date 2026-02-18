#!/usr/bin/env node

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

import { program } from "commander";
import fs from "node:fs";
import path from "node:path";
import { globSync } from "./glob.js";

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
const optsArgv = sep >= 0 ? argv.slice(0, sep) : argv;
const explicitPaths = sep >= 0 ? argv.slice(sep + 1) : null;

program
  .option("-g, --glob", "treat path arguments as glob patterns")
  .option("-G, --no-glob", "treat path arguments as literal paths (default)")
  .allowUnknownOption()
  .parse(optsArgv, { from: "user" });

const opts = program.opts();
const useGlob = opts.glob === true;
const pathsFromArgs = explicitPaths ?? program.args;

if (pathsFromArgs.length === 0) {
  process.exitCode = 0;
  process.exit(0);
}

function expandPaths(patterns) {
  if (!useGlob) {
    return patterns;
  }
  const out = [];
  for (const p of patterns) {
    const matches = globSync(p);
    out.push(...matches);
  }
  return out;
}

function rimrafSync(target) {
  const resolved = path.resolve(target);
  try {
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      fs.rmSync(resolved, { recursive: true, force: true });
    } else {
      fs.unlinkSync(resolved);
    }
  } catch (err) {
    if (err?.code !== "ENOENT") {
      console.error(`rimraf: ${target}: ${err?.message ?? err}`);
      process.exitCode = 1;
    }
  }
}

const paths = expandPaths(pathsFromArgs);
for (const p of paths) {
  rimrafSync(p);
}
