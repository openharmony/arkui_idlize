/**
 * Менеджер трансформаций для форматирования длинных строк
 */

import { TransformationResult, FormattingContext } from './types';

export class TransformationManager {
  private transformations: TransformationResult[] = [];

  /**
   * Добавляет трансформацию
   */
  addTransformation(start: number, width: number, newText: string): void {
    // Проверяем, есть ли уже трансформация в этой позиции
    const existingIndex = this.transformations.findIndex(t => t.start === start);
    
    if (existingIndex >= 0) {
      return;
    }
    
    this.transformations.push({
      start,
      end: start + width,
      newText
    });
  }

  /**
   * Применяет все трансформации к контенту
   */
  applyTransformations(content: string): string {
    if (this.transformations.length === 0) {
      return content;
    }
    
    // Сортируем трансформации от конца к началу, чтобы не сбить позиции
    const sortedTransformations = [...this.transformations].sort((a, b) => b.start - a.start);
    
    let result = content;
    for (const transformation of sortedTransformations) {
      result = result.substring(0, transformation.start) + 
               transformation.newText + 
               result.substring(transformation.end);
    }
    
    return result;
  }

  /**
   * Проверяет, есть ли конфликтующие трансформации
   */
  hasConflicts(): boolean {
    const sorted = [...this.transformations].sort((a, b) => a.start - b.start);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      if (current && next && current.end > next.start) {
        return true; // Перекрытие
      }
    }
    
    return false;
  }

  /**
   * Очищает все трансформации
   */
  clear(): void {
    this.transformations = [];
  }

  /**
   * Получает количество трансформаций
   */
  getCount(): number {
    return this.transformations.length;
  }

  /**
   * Получает все трансформации (только для чтения)
   */
  getTransformations(): readonly TransformationResult[] {
    return this.transformations;
  }

  /**
   * Валидирует результат трансформации
   */
  validateResult(original: string, transformed: string, context: FormattingContext): TransformationValidationResult {
    const originalLines = original.split('\n');
    const transformedLines = transformed.split('\n');
    
    const issues: string[] = [];
    
    // Проверяем, что количество строк не уменьшилось критично
    if (transformedLines.length < originalLines.length * 0.8) {
      issues.push('Слишком большое сокращение количества строк');
    }
    
    // Проверяем, что длинные строки действительно стали короче
    let improvedLines = 0;
    let worsenedLines = 0;
    
    for (let i = 0; i < Math.min(originalLines.length, transformedLines.length); i++) {
      const originalLength = originalLines[i]?.length || 0;
      const transformedLength = transformedLines[i]?.length || 0;
      
      if (originalLength > context.maxLineLength) {
        if (transformedLength <= context.maxLineLength) {
          improvedLines++;
        } else if (transformedLength > originalLength) {
          worsenedLines++;
        }
      }
    }
    
    // Проверяем дополнительные строки
    for (let i = originalLines.length; i < transformedLines.length; i++) {
      const lineLength = transformedLines[i]?.length || 0;
      if (lineLength > context.maxLineLength) {
        worsenedLines++;
      }
    }
    
    if (worsenedLines > improvedLines) {
      issues.push('Трансформация ухудшила ситуацию с длинными строками');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      improvedLines,
      worsenedLines
    };
  }
}

export interface TransformationValidationResult {
  isValid: boolean;
  issues: string[];
  improvedLines: number;
  worsenedLines: number;
}