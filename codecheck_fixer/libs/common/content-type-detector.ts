/**
 * Детектор типа контента файла для определения TS/TSX/ARKTS
 */
import * as path from 'path';
import { ContentType } from './common-types';

export class ContentTypeDetector {
  static detectFileType(filePath: string): ContentType {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
      case '.ts': return ContentType.TS;
      case '.tsx': return ContentType.TSX;
      case '.ets': return ContentType.ARKTS;
      case '.cpp':
      case '.cc':
      case '.cxx':
      case '.c++':
      case '.hpp':
      case '.h': return ContentType.CPP;
      default:
        return ContentType.UNKNOWN;
    }
  }
}


