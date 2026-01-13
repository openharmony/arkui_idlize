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

import { readdir, stat } from "node:fs"
import { join } from "node:path"

export function scan(root: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        stat(root, (err, info) => {
            if (err) {
                return reject(err)
            }
            if (info.isDirectory()) {
                readdir(root, (err, files) => {
                    if (err) {
                        return reject(err)
                    }
                    Promise.all(files.map(file => scan(join(root, file))))
                        .then(result => resolve(result.flat()))
                        .catch(reject)
                })
            } else {
                resolve([root])
            }
        })
    })
}
