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

'use strict';

const {
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const { createHash } = require('node:crypto');
const { dirname, join, resolve } = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const HVIGOR_ENGINE_PACKAGE_NAME = '@ohos/hvigor';
const HVIGOR_OHOS_PLUGIN_PACKAGE_NAME = '@ohos/hvigor-ohos-plugin';
const HVIGOR = 'hvigor';
const PNPM = 'pnpm';
const PNPM_VERSION = '7.30.0';
const PACKAGE_JSON = 'package.json';
const HVIGOR_CONFIG_JSON = 'hvigor-config.json5';
const WORKSPACE = 'workspace';

const isWindows = process.platform === 'win32';
const npmTool = isWindows ? 'npm.cmd' : 'npm';
const pnpmTool = isWindows ? 'pnpm.cmd' : 'pnpm';

const projectRoot = process.cwd();
const hvigorUserHome = resolve(homedir(), '.hvigor');
const wrapperToolsHome = resolve(hvigorUserHome, 'wrapper', 'tools');
const wrapperPnpmScriptPath = resolve(wrapperToolsHome, 'node_modules', '.bin', pnpmTool);
const hvigorPnpmStorePath = resolve(hvigorUserHome, 'caches');
const projectCachesHome = resolve(hvigorUserHome, 'project_caches');
const projectWrapperHome = resolve(projectRoot, HVIGOR);

function logInfo(message) {
    console.log(message);
}

function logErrorAndExit(message) {
    console.error(message instanceof Error ? message.message : message);
    process.exit(-1);
}

function isFile(filePath) {
    return existsSync(filePath) && statSync(filePath).isFile();
}

function stripJsonComments(text) {
    let output = '';
    let inString = false;
    let quote = '';
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const current = text[i];
        const next = text[i + 1];

        if (inString) {
            output += current;
            if (escaped) {
                escaped = false;
            } else if (current === '\\') {
                escaped = true;
            } else if (current === quote) {
                inString = false;
                quote = '';
            }
            continue;
        }

        if (current === '"' || current === "'") {
            inString = true;
            quote = current;
            output += current;
            continue;
        }

        if (current === '/' && next === '/') {
            while (i < text.length && text[i] !== '\n') {
                i++;
            }
            output += '\n';
            continue;
        }

        if (current === '/' && next === '*') {
            i += 2;
            while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
                output += text[i] === '\n' ? '\n' : '';
                i++;
            }
            i++;
            continue;
        }

        output += current;
    }

    return output;
}

function parseJson5File(filePath) {
    if (!isFile(filePath)) {
        logErrorAndExit(`Error: Hvigor config file ${filePath} does not exist.`);
        return null;
    }

    try {
        const jsonText = stripJsonComments(readFileSync(filePath, 'utf8'))
            .replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonText);
    } catch (error) {
        logErrorAndExit(error);
        return null;
    }
}

function hasPackage(packageName, roots) {
    try {
        require.resolve(packageName, { paths: [...roots] });
        return true;
    } catch (error) {
        return false;
    }
}

function getNpmPath() {
    return join(dirname(process.execPath), npmTool);
}

function runCommand(command, args, options) {
    const result = spawnSync(command, args, options);
    if (result.status !== 0) {
        throw new Error(`Error: ${command} ${args.join(' ')} execute failed. See above for details.`);
    }
}

function checkNpmConfig() {
    if (isFile(resolve(projectRoot, '.npmrc')) || isFile(resolve(homedir(), '.npmrc'))) {
        return;
    }

    const npmPath = getNpmPath();
    const result = spawnSync(npmPath, ['config', 'get', 'prefix'], {
        cwd: projectRoot,
        encoding: 'utf8',
    });
    if (result.status !== 0 || !result.stdout) {
        logErrorAndExit('Error: The hvigor depends on the npmrc file. Configure the npmrc file first.');
    }

    const globalNpmrc = resolve(result.stdout.replace(/[\r\n]/g, ''), '.npmrc');
    if (!isFile(globalNpmrc)) {
        logErrorAndExit('Error: The hvigor depends on the npmrc file. Configure the npmrc file first.');
    }
}

function convertOfflineDependency(dependency) {
    if (dependency.startsWith('file:') || dependency.endsWith('.tgz')) {
        return resolve(projectRoot, HVIGOR, dependency.replace('file:', ''));
    }
    return dependency;
}

function isPnpmInstalled() {
    return existsSync(wrapperPnpmScriptPath) && hasPackage(PNPM, [wrapperToolsHome]);
}

function installPnpm() {
    logInfo(`Installing pnpm@${PNPM_VERSION}...`);
    mkdirSync(wrapperToolsHome, { recursive: true });
    writeFileSync(
        resolve(wrapperToolsHome, PACKAGE_JSON),
        JSON.stringify({ dependencies: { [PNPM]: PNPM_VERSION } })
    );
    runCommand(getNpmPath(), ['install', PNPM], {
        cwd: wrapperToolsHome,
        stdio: ['inherit', 'inherit', 'inherit'],
        env: process.env,
    });
    logInfo('Pnpm install success.');
}

function compareVersion(a, b) {
    const left = a.split('.').map(part => Number.parseInt(part, 10) || 0);
    const right = b.split('.').map(part => Number.parseInt(part, 10) || 0);
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i++) {
        if ((left[i] || 0) > (right[i] || 0)) {
            return 1;
        }
        if ((left[i] || 0) < (right[i] || 0)) {
            return -1;
        }
    }
    return 0;
}

function canUseSharedDependencyCache(config) {
    const dependencies = config.dependencies || {};
    const names = Object.keys(dependencies);
    if (config.hvigorVersion.startsWith('file:') || config.hvigorVersion.endsWith('.tgz')) {
        return false;
    }
    if (names.some(name => dependencies[name].startsWith('file:') || dependencies[name].endsWith('.tgz'))) {
        return false;
    }
    return names.length === 1 &&
        names[0] === HVIGOR_OHOS_PLUGIN_PACKAGE_NAME &&
        compareVersion(config.hvigorVersion, '2.5.0') > 0;
}

function makeHash(value) {
    return createHash('MD5').update(value).digest('hex');
}

function makeCacheKey(config) {
    if (!canUseSharedDependencyCache(config)) {
        return makeHash(projectRoot);
    }

    let value = `${HVIGOR_ENGINE_PACKAGE_NAME}@${config.hvigorVersion}`;
    Object.keys(config.dependencies || {}).sort().forEach(name => {
        value += `,${name}@${config.dependencies[name]}`;
    });
    return makeHash(value);
}

function readWorkspacePackage(workspaceRoot) {
    const packagePath = resolve(workspaceRoot, PACKAGE_JSON);
    if (!isFile(packagePath)) {
        return { dependencies: {} };
    }
    return JSON.parse(readFileSync(packagePath, 'utf8'));
}

function dependencyCount(packageLike) {
    return Object.keys(packageLike.dependencies || {}).length;
}

function dependenciesMatch(config, packageJson) {
    const packageDependencies = packageJson.dependencies || {};
    if (convertOfflineDependency(config.hvigorVersion) !== packageDependencies[HVIGOR_ENGINE_PACKAGE_NAME]) {
        return false;
    }
    if (dependencyCount(config) + 1 !== dependencyCount(packageJson)) {
        return false;
    }

    return Object.keys(config.dependencies || {}).every(name => {
        return convertOfflineDependency(config.dependencies[name]) === packageDependencies[name];
    });
}

function packagesInstalled(config, workspaceRoot) {
    if (!hasPackage(HVIGOR_ENGINE_PACKAGE_NAME, [workspaceRoot])) {
        return false;
    }

    return Object.keys(config.dependencies || {}).every(name => hasPackage(name, [workspaceRoot]));
}

function writeWorkspacePackage(config, workspaceRoot) {
    const dependencies = {};
    Object.keys(config.dependencies || {}).forEach(name => {
        dependencies[name] = convertOfflineDependency(config.dependencies[name]);
    });
    dependencies[HVIGOR_ENGINE_PACKAGE_NAME] = convertOfflineDependency(config.hvigorVersion);

    mkdirSync(workspaceRoot, { recursive: true });
    writeFileSync(resolve(workspaceRoot, PACKAGE_JSON), JSON.stringify({ dependencies }));
}

function installProjectWorkspace(config, workspaceRoot) {
    logInfo('Hvigor installing...');
    writeWorkspacePackage(config, workspaceRoot);
    runCommand(wrapperPnpmScriptPath, ['config', 'set', 'store-dir', hvigorPnpmStorePath], {
        cwd: workspaceRoot,
        stdio: ['inherit', 'inherit', 'inherit'],
    });

    const installArgs = ['install'];
    if (isCi()) {
        installArgs.push('--no-frozen-lockfile');
    }
    runCommand(wrapperPnpmScriptPath, installArgs, {
        cwd: workspaceRoot,
        stdio: ['inherit', 'inherit', 'inherit'],
    });
    logInfo('Hvigor install success.');
}

function isCi() {
    if (process.env.CI === 'false') {
        return false;
    }

    return Boolean(
        process.env.BUILD_ID ||
        process.env.BUILD_NUMBER ||
        process.env.CI ||
        process.env.CI_APP_ID ||
        process.env.CI_BUILD_ID ||
        process.env.CI_BUILD_NUMBER ||
        process.env.CI_NAME ||
        process.env.CONTINUOUS_INTEGRATION ||
        process.env.RUN_ID
    );
}

function cleanWorkspace(cacheRoot) {
    const workspaceRoot = resolve(cacheRoot, WORKSPACE);
    logInfo('Hvigor cleaning...');
    if (!existsSync(workspaceRoot)) {
        return;
    }

    const hvigorBin = resolve(workspaceRoot, 'node_modules', '@ohos', 'hvigor', 'bin', 'hvigor.js');
    if (existsSync(hvigorBin)) {
        spawnSync(process.argv[0], [hvigorBin, '--stop-daemon'], {});
    }

    try {
        readdirSync(workspaceRoot).forEach(entry => {
            rmSync(resolve(workspaceRoot, entry), { recursive: true, force: true });
        });
    } catch (error) {
        logErrorAndExit(`The hvigor build tool cannot be installed. Please manually clear the workspace directory and synchronize the project again.\n\nWorkspace Path: ${workspaceRoot}.`);
    }
}

function initProjectWorkspace() {
    const config = parseJson5File(resolve(projectWrapperHome, HVIGOR_CONFIG_JSON));
    const cacheRoot = resolve(projectCachesHome, makeCacheKey(config));
    const workspaceRoot = resolve(cacheRoot, WORKSPACE);
    const packageJson = readWorkspacePackage(workspaceRoot);

    if (!packagesInstalled(config, workspaceRoot) || !dependenciesMatch(config, packageJson)) {
        try {
            checkNpmConfig();
            installProjectWorkspace(config, workspaceRoot);
        } catch (error) {
            cleanWorkspace(cacheRoot);
            logErrorAndExit(error);
        }
    }

    return workspaceRoot;
}

function executeBuild(workspaceRoot) {
    const hvigorPath = resolve(workspaceRoot, 'node_modules', '@ohos', 'hvigor', 'bin', 'hvigor.js');
    let hvigorBin;
    try {
        hvigorBin = realpathSync(hvigorPath);
    } catch (error) {
        logErrorAndExit(`Error: ENOENT: no such file ${hvigorPath}, delete ${workspaceRoot} and retry.`);
    }

    const child = spawn('node', [hvigorBin, ...process.argv.slice(2)], {
        env: process.env,
        stdio: 'inherit',
    });
    child.on('exit', code => {
        process.exit(code ?? -1);
    });
    child.on('error', logErrorAndExit);
}

process.env['npm_config_update-notifier'] = 'false';
if (!isPnpmInstalled()) {
    try {
        checkNpmConfig();
        installPnpm();
    } catch (error) {
        logErrorAndExit(error);
    }
}
executeBuild(initProjectWorkspace());
