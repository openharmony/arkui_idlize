#!/usr/bin/env ts-node
// @ts-nocheck

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

import { readFileSync } from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  formatSourceCode,
  inferLanguageFromFilePath,
  PrettierFormattingError
} from '../../libs/prettier_formatter';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('file', {
      type: 'string',
      demandOption: true,
      describe: 'Path to TypeScript/TSX file to format'
    })
    .option('strict', {
      type: 'boolean',
      default: false,
      describe: 'Enable strict mode: fail on source parsing error'
    })
    .help()
    .parse();

  const targetPath = path.resolve(argv.file);
  const code = readFileSync(targetPath, 'utf-8');

  const language = inferLanguageFromFilePath(targetPath);

  let formattingError: PrettierFormattingError | null = null;
  const formatted = await formatSourceCode({
    code,
    language,
    filePath: targetPath,
    strictParsing: argv.strict,
    onFormattingError: (error) => {
      formattingError = error;
    }
  });

  if (formattingError) {
    console.warn('[prettier-based] Warning: failed to format file in strict mode. Returning input unchanged.');
    console.warn(`Reason: ${formattingError.message}`);
  }

  process.stdout.write(formatted);
}

main().catch((error) => {
  console.error('Formatting error:', error);
  process.exit(1);
});
