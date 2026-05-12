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
const fs = require('fs');
const path = require('path');

// Read configuration file
const configPath = path.resolve(__dirname, '../aftergen-config.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    console.error('Failed to read configuration file:', err.message);
    process.exit(1);
}

// Get input directory path from command line arguments
const inputPath = process.argv[2];
if (!inputPath) {
    console.error('Usage: node aftergen.js <directory-path>');
    process.exit(1);
}

// Construct target directory path
const targetPath = path.join(inputPath, 'sig/arkoala-arkts/arkui/generated');

// Validate configuration format
if (!config || !Array.isArray(config.removehandwritten)) {
    console.error('Invalid configuration format: removehandwritten should be an array');
    process.exit(1);
}

// Process each file in the removal list
config.removehandwritten.forEach(relativePath => {
    const fullPath = path.join(targetPath, relativePath);
    
    try {
        // Check if file exists before attempting deletion
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${fullPath}`);
        } else {
            console.warn(`File not found: ${fullPath}`);
        }
    } catch (err) {
        console.error(`Deletion failed [${fullPath}]:`, err.message);
    }
});

console.log('File cleanup completed');