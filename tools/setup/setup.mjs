import * as fs from 'fs';
import { program } from 'commander';
import path from 'path';
import { execSync } from 'child_process';

const CWD = process.cwd()
const options = program
    .option(`--template [ts_subset|ts_peers]`)
    .option(`--out <path>`)
    .parse()
    .opts()

function execOut(command) {
    execSync(command, { cwd: options.out, stdio: 'inherit' })
}

function installExternal() {
    const externalPackagesToInstall = [
        `incremental/compat`,
        `incremental/common`,
        `incremental/runtime`,
        `interop`,
    ]
    execOut(`npm i`)
    for (const pkg of externalPackagesToInstall) {
        const pkgRelative = path.relative(options.out, path.join('external', pkg))
        // TODO need to precompile globally (on idlize repo init f.e.). And maybe cache `npm i` results in root
        console.log(`Compiling package <${pkg}>`)
        execOut(`cd ${pkgRelative} && npm run compile`)
        console.log(`Installing package <${pkg}>`)
        execOut(`npm i ${pkgRelative}`)
    }
}

function symlinkSdk() {
    fs.symlinkSync(path.join(CWD, './interface_sdk-js/api/\@internal/component/ets'), path.join(CWD, options.out, 'sdk'))
}

function main() {
    const templatesHandlers = {
        ts_subset: installExternal,
        ts_peers: () => {
            installExternal()
            symlinkSdk()
        },
    }

    fs.rmSync(options.out, { recursive: true, force: true })
    fs.cpSync(path.join(CWD, 'tools/setup/templates', options.template), options.out, { recursive: true })
    templatesHandlers[options.template]()
}

main()