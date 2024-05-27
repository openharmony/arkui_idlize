import * as fs from "node:fs"
import { execSync, exec } from "node:child_process"
import os from "os";
import { argv } from 'process'

let isFull = true
let isArm64 = true

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
let pushDeps4OhosPerfAppCmd = `node ./ohos-app/getDependencies4ohos.mjs ${mode} ${arch}`
execSync(pushDeps4OhosPerfAppCmd, { cwd: '.', stdio: 'inherit'})


const platform = os.platform();

const perfDir = "ohos-app/api_perf"

if (!fs.existsSync(perfDir)) {
    console.log(`There is no perf app ...`)
    process.exit(0)
}

let hvigorw = `.\\hvigorw`
if (!platform.includes('win')) {
    hvigorw = `./hvigorw`
}
const buildCmd = `${hvigorw} --mode module -p module=entry@default -p product=default -p buildMode=release assembleHap --analyze --parallel --incremental --daemon`

execSync(`${buildCmd}`, { cwd: perfDir, stdio: 'inherit'})

const hapName = `entry-default-signed.hap`
const hapPath = `${perfDir}/entry/build/default/outputs/default/${hapName}`
const packageName = `com.example.api_perf`
const tmplog = `.tmplog`


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
    if (!platform.includes('win')) {
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
    if (!platform.includes('win')) {
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
    execSync(`hdc install ${hapPath}`, { stdio:'inherit', timeout: 2000 })

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

if (fs.existsSync(hapPath)) {
    console.log(`Run perf app`)
    runHap(hapPath, packageName)
}

