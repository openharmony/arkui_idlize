#!/usr/bin/env ts-node

// @ts-nocheck

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
      describe: 'Путь до файла TypeScript/TSX, который нужно отформатировать'
    })
    .option('strict', {
      type: 'boolean',
      default: false,
      describe: 'Включить строгий режим: падать при ошибке разбора исходника'
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
    console.warn('[prettier-based] Предупреждение: не удалось отформатировать файл в строгом режиме. Возвращаю входные данные без изменений.');
    console.warn(`Причина: ${formattingError.message}`);
  }

  process.stdout.write(formatted);
}

main().catch((error) => {
  console.error('Ошибка форматирования:', error);
  process.exit(1);
});
