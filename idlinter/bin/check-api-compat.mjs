import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const tmpdir = `/tmp/api-compat-${process.pid}`
let isIdlize = false;
const args = process.argv.slice(2);
if (args[0] === '--idlize') {
    isIdlize = true;
    args.shift();
}
let [repo_dir, commit, base] = args;
if (!commit || !(fs.existsSync(repo_dir) && fs.lstatSync(repo_dir).isDirectory())) {
    console.log('Usage:')
    console.log('        $(basename $0) [--idlize] <repo> <commit> [<base>]')
    console.log('Check <commit> for compatibility against <base>.')
    console.log('If <base> is missing, check against previous commit (<base> is <commit>~).')
    process.exit(-1)
}

repo_dir = path.resolve(repo_dir)
process.chdir(`${path.dirname(process.argv[1])}/../..`)

if (isIdlize) {
    // The following is an adapter. Because our CI runs on one workspace (idlize), but checks another
    // one (interface_sdk-js), we hereby translate idlize commit hashes into corresponding hashes in
    // the SDK workspace. This is done by examining the external/download-sdk.json file.
    //
    // In normal operation, when CI runs on SDK workspace itself, just use `base` and `commit` as is.
    function getSdkCommit(commit) {
        exec(`git fetch origin ${commit}`)
        const downloadSdkJson = execSync(`git show origin/${commit}:external/download-sdk.json`).toString()
        return JSON.parse(downloadSdkJson).ref.slice(0, 8)
    }
    base = getSdkCommit(base)
    commit = getSdkCommit(commit)
    console.log(`Checking ${commit} against ${base}`)
    if (base === commit) {
        console.log('SDK versions are the same, skipping compatibility check')
        process.exit(0)
    }
} else {
    if (!base)
        base = execSync(`git -C ${repo_dir} rev-parse ${commit}~`, {stdio: 'pipe'}).toString().slice(0, 8)
}

exec('npm run compile -C runner')
exec('npm run compile -C idlinter')

commit2idl(base)
commit2idl(commit)

console.clear()
try {
    exec(`node idlinter compat ${tmpdir}.${base}.idl ${tmpdir}.${commit}.idl`)
} catch (error) {
    // errors are output to the console, so just exit with a non-zero code
    process.exit(1)
}


function exec(cmd) {
    execSync(cmd, {stdio: 'inherit'})
}
function commit2idl(commit) {
    function rmTempDirs(...suffixes) {
        suffixes.forEach(suf => fs.rmSync(`${tmpdir}.${commit}${suf}`, { recursive: true, force: true }))
    }
    rmTempDirs('', '.patched', '.patched1', '.idl')
    exec(`git -C ${repo_dir} worktree add -f ${tmpdir}.${commit} ${commit}`)
    exec(`node runner sdk ${tmpdir}.${commit} ${tmpdir}.${commit}.patched ${tmpdir}.${commit}.patched1`)
    exec(`node etsgen --ets2idl --docs none ` +
         `--base-dir ${tmpdir}.${commit}.patched/api --input-dir ${tmpdir}.${commit}.patched/api ` +
         `--output-dir ${tmpdir}.${commit}.idl`)
}
