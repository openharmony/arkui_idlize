/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
const { readFileSync } = require('node:fs');
const { EOL } = require('node:os');
const { join, resolve } = require('node:path');

const HOME = resolve(__dirname)

function main() {
    const content = readFileSync(join(HOME, '..', 'theList.csv'), 'utf-8')
    const lines = content.split(EOL).filter(Boolean)
    const cells = lines.map(line => line.split(','))

    const index = new Map()
    cells.forEach(line => {
        const [file, decl, flag] = line
        if (decl) {
            if (!index.has(decl)) {
                index.set(decl, [])
            }
            index.get(decl).push(file)
        }
    })

    console.error('_________ REPEATS _________')
    for (const [decl, files] of index) {
        if (files.length > 1) {
            console.error(decl, files)
        }
    }

    const materialized = []
    const structures = []
    cells.forEach(line => {
        const [file, decl, flag] = line
        if (flag) {
            const preparedFlag = flag.trim().toUpperCase()
            const fqName = guessFQName(file, decl)
            if (preparedFlag === 'N') {
                materialized.push([file, decl, fqName])
            }
            if (preparedFlag === 'Y') {
                structures.push([file, decl, fqName])
            }
        }
    })

    console.error('_________ MATERIALIZED _________')
    materialized.forEach(record => {
        console.log(`"${record[2]}",`);
    })

    console.error('_________ STRUCTURES _________')
    structures.forEach(record => {
        console.log(`"${record[2]}",`);
    });
}
main();

///////////////////////////////////////////////////////////////////////////

function guessFQName(file, decl) {
    const trimmed = file.substring(file.indexOf('@') + 1);
    return trimmed.split('/')
        .flatMap(f => f.split('.'))
        .filter(f => f)
        .concat([decl])
        .join('.');
}
