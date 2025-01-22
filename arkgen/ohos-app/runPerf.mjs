import * as fs from "node:fs"
import { execSync, exec } from "node:child_process"
import os from "os";
import { argv } from 'process'
import path from "node:path";
import { exit } from "node:process";

let isFull = true
let isArm64 = true
let isMock = false

for (let i = 2; i < argv.length; ++i) {
    switch (argv[i]) {
        case "subset":
            isFull = false
            break;
        case "full":
            isFull = true
            break;
        case "arm64":
            isArm64 = true
            break;
        case "arm32":
        case "arm":
            isArm64 = false
            break;
        case "mock":
            isMock = true
            break;
        default:
            break;
    }
}

console.log(`runPerf isArm64 = ${isArm64}`)
console.log(`runPerf isFull = ${isFull}`)

let arch = `arm64`
let mode = `full`
if (!isArm64) arch = `arm32`
if (!isFull) mode = `subset`

const platform = os.platform();

const perfDir = "ohos-app/api_perf"

if (!fs.existsSync(perfDir)) {
    console.log(`There is no perf app ...`)
    process.exit(0)
}

const thirdToolsDir = `3rdtools`
const signToolsDir = `${thirdToolsDir}/oh_sign`
const unsignedHapName = `entry-default-unsigned.hap`
const signedHapName = `entry-release-signed.hap`
const unsignedHapPathInProject = `${perfDir}/entry/build/default/outputs/default/${unsignedHapName}`
const unsignedHapPath = `${signToolsDir}/${unsignedHapName}`
const signedHapPath = `${signToolsDir}/${signedHapName}`
const packageName = `com.example.api_perf`
const tmplog = `.tmplog`

let deviceLibDir = `lib64`
if (!isArm64) deviceLibDir = `lib`
const libaceMockName = `libace_compatible_mock.so`
const libaceMockHostPath = path.resolve(`native/${libaceMockName}`)
const libaceMockDevicePath = `/system/${deviceLibDir}/module/${libaceMockName}`

let hvigorw = `.\\hvigorw`
let signRelease  = `.\\sign_release`
if (!(platform === 'win32')) {
    hvigorw = `./hvigorw`
    signRelease = `./sign_release`
}

function checkEnv() {
    if (isMock && !fs.existsSync(libaceMockHostPath)) {
        console.error(`${libaceMockHostPath} is not exsit`)
        return false
    }
    return true
}

function mountRW() {
    execSync(`hdc shell mount -o rw,remount /`, {stdio: 'inherit'})
}

function cleanEnv() {
    const rmAceCmd = `hdc shell rm -f ${libaceMockDevicePath}`
    console.log(`${rmAceCmd}`)
    execSync(`${rmAceCmd}`, { cwd: '.', stdio: 'inherit', timeout: 2000 })
}

function resolveDependencies() {
    let pushDeps4OhosPerfAppCmd = `node ./ohos-app/getDependencies4ohos.mjs ${mode} ${arch}`
    console.log(`${pushDeps4OhosPerfAppCmd}`)
    execSync(pushDeps4OhosPerfAppCmd, { cwd: '.', stdio: 'inherit'})
    if (!isMock) return
    const pushAceCmd = `hdc file send ${libaceMockHostPath} ${libaceMockDevicePath}`
    console.log(`${pushAceCmd}`)
    execSync(`${pushAceCmd}`, { cwd: '.', stdio: 'inherit'})
}

function buildPerfProject() {
    const buildCmd = `${hvigorw} --mode module -p module=entry@default -p product=default -p buildMode=release assembleHap --analyze --parallel --incremental --daemon`
    console.log(buildCmd)
    execSync(`${buildCmd}`, { cwd: perfDir, stdio: 'inherit'})
}

function signHap() {
    if (!fs.existsSync(signToolsDir)) {
        console.log(`get 3rdtools for oh_sign tools`)
        if (fs.existsSync(thirdToolsDir)) fs.rmdirSync(thirdToolsDir)
        let downloadCmd = `node ./download-3rdtools.mjs ${arch}`
        execSync(downloadCmd, { cwd: '.', stdio: 'inherit' })
    }
    console.log(`copy ${unsignedHapPathInProject} to ${signToolsDir}`)
    fs.copyFileSync(unsignedHapPathInProject, unsignedHapPath)
    console.log(`sign ${unsignedHapPath}`)
    execSync(signRelease, { cwd: signToolsDir, stdio: 'inherit'})
}

function executeCommandWithTimeout(command, timeout, print) {
    const childProcess = exec(command)
    setTimeout(() => {
        try {
            execSync(print, { stdio: 'inherit' })
        } catch (error) {
            console.log(`${error}`)
        }

        console.log(`kill hdc`)
        killHdc()
        console.log(`kill childProcess.pid(${childProcess.pid}) process.pid(${process.pid})`)
        childProcess.kill()
        process.kill(process.pid)
    }, timeout)
}

function killHdc() {
    let processName
    let killCommand
    if (!(platform === 'win32')) {
        processName = 'hdc'
        killCommand = `ps aux | grep '${processName}' | awk '{print$2}' | xargs kill`
        execSync(killCommand, { stdio: 'inherit'})
    } else {
        processName = 'hdc.exe'
        killCommand = `taskkill /F /IM ${processName}`
        execSync(killCommand, { stdio: 'inherit'})
    }
}

function RemoveTmpLog() {
    let rmLogCmd
    if (!(platform === 'win32')) {
        rmLogCmd = `rm -f ${tmplog}`
        execSync(rmLogCmd, { stdio: 'inherit'})
    } else {
        rmLogCmd = `del ${tmplog}`
        execSync(rmLogCmd, { stdio: 'inherit'})
    }
}

function runHap(hapPath, packageName) {
    console.log(`stop ${packageName}`)
    execSync(`hdc shell aa force-stop ${packageName}`, { stdio:'inherit', timeout: 2000 })
    console.log(`uninstall ${packageName}`)
    execSync(`hdc uninstall ${packageName}`, { stdio:'inherit', timeout: 2000 })
    console.log(`install ${hapPath}`, { stdio:'inherit', timeout: 2000 })
    execSync(`hdc install ${hapPath}`, { stdio:'inherit', timeout: 3000 })

    console.log(`clear logs`)
    execSync(`hdc shell hilog -r`, { stdio: 'inherit'})

    killHdc()
    RemoveTmpLog()

    const command = `hdc shell hilog > ${tmplog}`
    const printCmd = `grep trace_name ${tmplog}`
    const timeout = isArm64 ? 4000 : 10000;
    executeCommandWithTimeout(command, timeout, printCmd)

    console.log(`startup ${packageName}`)
    execSync(`hdc shell aa start -a EntryAbility -b ${packageName}`, { stdio:'inherit', timeout: 2000 })
}

if (!checkEnv()) exit()
mountRW()
cleanEnv()
resolveDependencies()
buildPerfProject()
signHap()

if (fs.existsSync(signedHapPath)) {
    console.log(`Run perf app`)
    runHap(signedHapPath, packageName)
}

