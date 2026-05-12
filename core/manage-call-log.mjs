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
import { readFileSync, writeFileSync } from 'fs';

const filePath = './package.json';
const args = process.argv.slice(2);

try {
    if (args.length !== 1 || (args[0] !== '--add' && args[0] !== '--remove')) {
        console.error('Usage: node manage-call-log.mjs --add | --remove');
        process.exit(1);
    } else {
        const action = args[0]
        let data = readFileSync(filePath, 'utf8');
        let updatedData = null;
        if (action === '--add') {
            updatedData = data.replace(/--dts2peer/g, '--dts2peer --call-log');
        } else if (action === '--remove') {
            updatedData = data.replace(/--dts2peer --call-log/g, '--dts2peer');
        }
        writeFileSync(filePath, updatedData, 'utf8');
        console.log("Successfully updated the package.json file.");
    }        
} catch (error) {
    console.error("Error reading or writing to package.json:", error);
}
