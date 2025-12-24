/**
 * Formatter for TypeScript code
 */

import { FormatterConfig } from '@/types';

export class TypeScriptFormatter {
  private config: FormatterConfig;

  constructor(config: FormatterConfig) {
    this.config = config;
  }

  format(content: string): string {
    let formatted = content;
    
    // Normalize indentation
    formatted = this.normalizeIndentation(formatted);
    
    // Format quotes
    formatted = this.formatQuotes(formatted);
    
    // Add/remove semicolons
    formatted = this.formatSemicolons(formatted);
    
    // Format trailing commas
    formatted = this.formatTrailingCommas(formatted);
    
    // Wrap long lines
    formatted = this.wrapLongLines(formatted);
    
    // Remove trailing whitespace
    formatted = this.removeTrailingWhitespace(formatted);
    
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

  private formatQuotes(content: string): string {
    const quote = this.config.quoteStyle === 'single' ? "'" : '"';
    const otherQuote = this.config.quoteStyle === 'single' ? '"' : "'";
    
    // Replace quotes, but avoid replacement inside string literals
    return content.replace(
      new RegExp(otherQuote + '([^' + otherQuote + ']*)' + otherQuote, 'g'),
      (match, content) => {
        // Check that this is not an escaped quote
        if (content.includes('\\' + otherQuote)) {
          return match;
        }
        return quote + content + quote;
      }
    );
  }

  private formatSemicolons(content: string): string {
    if (!this.config.semicolons) {
      // Remove semicolons at end of lines
      return content.replace(/;(\s*)$/gm, '$1');
    } else {
      // Add semicolons where needed
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
      // Add trailing commas in objects and arrays
      return content.replace(/(\w+)\s*$/gm, (match, p1, offset, string) => {
        const nextChar = string[offset + match.length];
        if (nextChar === '}' || nextChar === ']') {
          return p1 + ',';
        }
        return match;
      });
    } else {
      // Remove trailing commas
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

      // Simple line wrapping by words
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
