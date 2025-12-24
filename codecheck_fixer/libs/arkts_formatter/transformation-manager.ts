/**
 * Transformation manager for formatting long lines
 */

import { TransformationResult, FormattingContext } from './types';

export class TransformationManager {
  private transformations: TransformationResult[] = [];

  /**
   * Adds transformation
   */
  addTransformation(start: number, width: number, newText: string): void {
    // Check if transformation already exists at this position
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
   * Applies all transformations to content
   */
  applyTransformations(content: string): string {
    if (this.transformations.length === 0) {
      return content;
    }
    
    // Sort transformations from end to start to not mess up positions
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
   * Checks if there are conflicting transformations
   */
  hasConflicts(): boolean {
    const sorted = [...this.transformations].sort((a, b) => a.start - b.start);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      if (current && next && current.end > next.start) {
        return true; // Overlap
      }
    }
    
    return false;
  }

  /**
   * Clears all transformations
   */
  clear(): void {
    this.transformations = [];
  }

  /**
   * Gets transformation count
   */
  getCount(): number {
    return this.transformations.length;
  }

  /**
   * Gets all transformations (readonly)
   */
  getTransformations(): readonly TransformationResult[] {
    return this.transformations;
  }

  /**
   * Validates transformation result
   */
  validateResult(original: string, transformed: string, context: FormattingContext): TransformationValidationResult {
    const originalLines = original.split('\n');
    const transformedLines = transformed.split('\n');
    
    const issues: string[] = [];
    
    // Check that line count didn't decrease critically
    if (transformedLines.length < originalLines.length * 0.8) {
      issues.push('Too large reduction in line count');
    }
    
    // Check that long lines actually became shorter
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
    
    // Check additional lines
    for (let i = originalLines.length; i < transformedLines.length; i++) {
      const lineLength = transformedLines[i]?.length || 0;
      if (lineLength > context.maxLineLength) {
        worsenedLines++;
      }
    }
    
    if (worsenedLines > improvedLines) {
      issues.push('Transformation worsened long lines situation');
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