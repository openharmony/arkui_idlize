/**
 * Заглушка для форматтера C++ кода
 * TODO: Реализовать полноценный форматтер C++ с использованием clang-format или других инструментов
 */

import { FormatterConfig } from '@/types';

export class CppFormatter {
  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  format(content: string): string {
    let formatted = content;
    
    // Базовая нормализация отступов
    formatted = this.normalizeIndentation(formatted);
    
    // Удаление лишних пробелов
    formatted = this.removeTrailingWhitespace(formatted);
    
    // Базовая нормализация пробелов
    formatted = this.normalizeSpacing(formatted);
    
    return formatted;
  }

  private normalizeIndentation(content: string): string {
    const lines = content.split('\n');
    const indentChar = this.config.useTabs ? '\t' : ' '.repeat(this.config.tabSize);
    
    return lines.map(line => {
      if (line.trim() === '') return line;
      
      const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
      const normalizedSpaces = leadingSpaces.replace(/\t/g, ' '.repeat(this.config.tabSize)); // Конвертируем табы в пробелы
      const indentLevel = Math.floor(normalizedSpaces.length / this.config.tabSize);
      
      return indentChar.repeat(indentLevel) + line.trim();
    }).join('\n');
  }

  private removeTrailingWhitespace(content: string): string {
    return content.replace(/[ \t]+$/gm, '');
  }

  private normalizeSpacing(content: string): string {
    // Нормализация пробелов вокруг операторов
    let formatted = content;
    
    // Пробелы вокруг операторов
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
    
    // Пробелы после запятых
    formatted = formatted.replace(/,\s*/g, ', ');
    
    // Пробелы после точек с запятой
    formatted = formatted.replace(/;\s*/g, '; ');
    
    return formatted;
  }
}
