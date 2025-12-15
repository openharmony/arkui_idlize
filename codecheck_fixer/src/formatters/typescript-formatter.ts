/**
 * Форматтер для TypeScript кода
 */

import { FormatterConfig } from '@/types';

export class TypeScriptFormatter {
  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  format(content: string): string {
    let formatted = content;
    
    // Нормализация отступов
    formatted = this.normalizeIndentation(formatted);
    
    // Форматирование кавычек
    formatted = this.formatQuotes(formatted);
    
    // Добавление/удаление точек с запятой
    formatted = this.formatSemicolons(formatted);
    
    // Форматирование trailing commas
    formatted = this.formatTrailingCommas(formatted);
    
    // Обрезка длинных строк
    formatted = this.wrapLongLines(formatted);
    
    // Удаление лишних пробелов
    formatted = this.removeTrailingWhitespace(formatted);
    
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

  private formatQuotes(content: string): string {
    const quote = this.config.quoteStyle === 'single' ? "'" : '"';
    const otherQuote = this.config.quoteStyle === 'single' ? '"' : "'";
    
    // Заменяем кавычки, но избегаем замены внутри строковых литералов
    return content.replace(
      new RegExp(otherQuote + '([^' + otherQuote + ']*)' + otherQuote, 'g'),
      (match, content) => {
        // Проверяем, что это не экранированная кавычка
        if (content.includes('\\' + otherQuote)) {
          return match;
        }
        return quote + content + quote;
      }
    );
  }

  private formatSemicolons(content: string): string {
    if (!this.config.semicolons) {
      // Удаляем точки с запятой в конце строк
      return content.replace(/;(\s*)$/gm, '$1');
    } else {
      // Добавляем точки с запятой где нужно
      const lines = content.split('\n');
      return lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && 
            !trimmed.endsWith(';') && 
            !trimmed.endsWith('{') && 
            !trimmed.endsWith('}') &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('/*') &&
            !trimmed.startsWith('*') &&
            !trimmed.includes('if ') &&
            !trimmed.includes('for ') &&
            !trimmed.includes('while ') &&
            !trimmed.includes('function ') &&
            !trimmed.includes('class ')) {
          return line + ';';
        }
        return line;
      }).join('\n');
    }
  }

  private formatTrailingCommas(content: string): string {
    if (this.config.trailingCommas) {
      // Добавляем trailing commas в объектах и массивах
      return content.replace(/(\w+)\s*$/gm, (match, p1, offset, string) => {
        const nextChar = string[offset + match.length];
        if (nextChar === '}' || nextChar === ']') {
          return p1 + ',';
        }
        return match;
      });
    } else {
      // Удаляем trailing commas
      return content.replace(/,(\s*[}\]])/g, '$1');
    }
  }

  private wrapLongLines(content: string): string {
    if (this.config.maxLineLength <= 0) {
      return content;
    }

    const lines = content.split('\n');
    return lines.map(line => {
      if (line.length <= this.config.maxLineLength) {
        return line;
      }

      // Простое перенос строки по словам
      const words = line.split(' ');
      let result = '';
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).length <= this.config.maxLineLength) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) {
            result += currentLine + '\n';
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        result += currentLine;
      }

      return result;
    }).join('\n');
  }

  private removeTrailingWhitespace(content: string): string {
    return content.replace(/[ \t]+$/gm, '');
  }
}
