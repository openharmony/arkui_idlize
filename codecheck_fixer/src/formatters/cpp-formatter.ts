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
 * Placeholder for C++ code formatter
 * Improve: Implement full-featured C++ formatter using clang-format or other tools
 */

import { FormatterConfig } from '@/types';

export class CppFormatter {
  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  format(content: string): string {
    let formatted = content;

    // Basic indentation normalization
    formatted = this.normalizeIndentation(formatted);

    // Remove trailing whitespace
    formatted = this.removeTrailingWhitespace(formatted);

    // Basic spacing normalization
    formatted = this.normalizeSpacing(formatted);

    return formatted;
  }

  private normalizeIndentation(content: string): string {
    const lines = content.split('\n');
    const indentChar = this.config.useTabs ? '\t' : ' '.repeat(this.config.tabSize);

    return lines.map(line => {
      if (line.trim() === '') return line;

      const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
      const normalizedSpaces = leadingSpaces.replace(/\t/g, ' '.repeat(this.config.tabSize)); // Convert tabs to spaces
      const indentLevel = Math.floor(normalizedSpaces.length / this.config.tabSize);

      return indentChar.repeat(indentLevel) + line.trim();
    }).join('\n');
  }

  private removeTrailingWhitespace(content: string): string {
    return content.replace(/[ \t]+$/gm, '');
  }

  private normalizeSpacing(content: string): string {
    // Normalize spaces around operators
    let formatted = content;

    // Spaces around operators
    formatted = formatted.replace(/\s*=\s*/g, ' = ');
    formatted = formatted.replace(/\s*\+\s*/g, ' + ');
    formatted = formatted.replace(/\s*-\s*/g, ' - ');
    formatted = formatted.replace(/\s*\*\s*/g, ' * ');
    formatted = formatted.replace(/\s*\/\s*/g, ' / ');
    formatted = formatted.replace(/\s*==\s*/g, ' == ');
    formatted = formatted.replace(/\s*!=\s*/g, ' != ');
    formatted = formatted.replace(/\s*<\s*/g, ' < ');
    formatted = formatted.replace(/\s*>\s*/g, ' > ');
    formatted = formatted.replace(/\s*<=\s*/g, ' <= ');
    formatted = formatted.replace(/\s*>=\s*/g, ' >= ');
    formatted = formatted.replace(/\s*&&\s*/g, ' && ');
    formatted = formatted.replace(/\s*\|\|\s*/g, ' || ');

    // Spaces after commas
    formatted = formatted.replace(/,\s*/g, ', ');

    // Spaces after semicolons
    formatted = formatted.replace(/;\s*/g, '; ');

    return formatted;
  }
}
