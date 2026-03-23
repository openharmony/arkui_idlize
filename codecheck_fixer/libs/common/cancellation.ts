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

/** Controller for cancelling main thread blocking operations */
class CancellationTokenController {
  private cancelled = false;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    process.once('SIGINT', () => {
      if (!this.cancelled) {
        this.cancelled = true;
        try {
          process.stderr.write('\nReceived Ctrl+C signal. Aborting.\n');
        } catch {}
      }
      process.exit(130);
    });
  }

  public isCancelled(): boolean {
    return this.cancelled;
  }
}

export const cancellationToken = new CancellationTokenController();

