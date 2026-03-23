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
 * File content type detector for determining TS/TSX/ARKTS
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


