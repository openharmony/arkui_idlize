/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

export class HistoryTracker {
    private constructor(
        private line: string,
        private previous: HistoryTracker | undefined = undefined
    ) {}

    push(line:string) {
        return new HistoryTracker(
            line,
            this
        )
    }
    pop() {
        return this
    }

    toArray() {
        const result:string[] = []
        this.follow(line => {
            result.push(line)
        })
        return result
    }

    follow(op:(line:string) => void) {
        let current: HistoryTracker | undefined = this
        while (current !== undefined) {
            op(current.line)
            current = current.previous
        }
    }

    static create(line:string) {
        return new HistoryTracker(line, undefined)
    }
}
