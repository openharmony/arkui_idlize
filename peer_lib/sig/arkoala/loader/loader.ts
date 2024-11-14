/*
* Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { env } from "node:process"
import { int32 } from "@koalaui/common"
import { Worker, isMainThread, parentPort } from "node:worker_threads"
import { callCallback, wrapCallback } from "./CallbackRegistry"
import { KInt, KPointer, KUint8ArrayPtr, pointer } from "./types"

export interface LoaderOps {
    _LoadVirtualMachine(vmKind: int32, appClassPath: string, appLibPath: string): int32
    _StartApplication(arg0: string, arg1: string): KPointer
    _RunApplication(arg0: int32, arg1: int32): boolean
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void
}

// todo: for control VSYNC
export interface NativeControl extends LoaderOps {
    // todo: implement native methods
    _GetPipelineContext(ptr0: KPointer): KPointer
    _SetVsyncCallback(ptr0: KPointer, arg: KInt): void
    _UnblockVsyncWait(ptr0: KPointer): void
}

let theModule: NativeControl | undefined = undefined

declare const LOAD_NATIVE: NativeControl

export function nativeModule(): NativeControl {
    if (theModule) return theModule
    theModule = LOAD_NATIVE as NativeControl
    if (!theModule)
        throw new Error("Cannot load native module")
    theModule._SetCallbackDispatcher(callCallback)
    return theModule
}

let rootPointer: KPointer

function getNativePipelineContext(): KPointer {
    const root = rootPointer
    return nativeModule()._GetPipelineContext(root!)
}

function waitVSync(pipelineContext: KPointer): Promise<void> {
    return new Promise((resolve, reject) => {
        nativeModule()._SetVsyncCallback(pipelineContext, wrapCallback((args: KUint8ArrayPtr, length: int32) => {
            if (args instanceof Uint8Array) {
                const values = new Int32Array(args.buffer)
                if (values[0] != 0)
                    resolve()
            } else
                reject(new Error("vsync failed"))
            return 0
        }))
    })
}

export async function runEventLoop() {
    const pipelineContext = getNativePipelineContext()
    while (!nativeModule()._RunApplication(0, 0)) {
        await waitVSync(pipelineContext!)
    }
}

function runEs2Panda(msg: WorkerRequest): WorkerResponse {
    console.log(`JS: es2panda ${msg.files}`)
    return {
        id: msg.id,
        result: nativeModule()._LoadVirtualMachine(3, msg.files.join(","), msg.nativePath)
    }
}

let workers = new Array<Worker>()
let requests = new Map<int32, (result: int32) => void>()
let requestId = 0

interface WorkerRequest {
    kind: string
    id: int32
    files: string[]
    nativePath: string
}

interface WorkerResponse {
    id: int32
    result: int32
}

function compile(worker: Worker, nativePath: string, index: int32): Promise<int32> {
    return new Promise(resolve => {
        let id = requestId++
        requests.set(id, (result: int32) => {
            resolve(result)
            requests.delete(id)
        })
        worker.postMessage({
            kind: "compile",
            id: id,
            nativePath: nativePath,
            files: [`file${index}.sts`, `shmile${index}.sts`]
        })
    })
}

function runEs2PandaMain(nativePath: string): int32 {
    if (!isMainThread) return 0

    for (let i = 0; i < 10; i++) {
        workers.push(new Worker(__filename))
        workers[i].on("message", (response: WorkerResponse) => {
            requests.get(response.id)!(response.result)
        })
    }
    setTimeout(async () => {
        await Promise.all(
            workers.map((worker, index) => compile(worker, nativePath, index)))
        workers.forEach(worker => worker.terminate())
    }, 0)
    return 0
}

export function initWorker() {
    // Here we're in the worker.
    parentPort!.addListener("message", (request: WorkerRequest) => {
        processRequest(request)
            .then((response) => {
                parentPort!.postMessage(response)
            })
    })

    function processRequest(request: WorkerRequest): Promise<WorkerResponse> {
        return new Promise((resolve, reject) => {
            if (request.kind == "compile") {
                resolve(runEs2Panda(request))
            } else {
                reject(`Unknown request: ${request}`)
            }
        })
    }
}

export function checkLoader(variant: string): int32 {
    let vm = -1
    let classPath = ""
    let nativePath = __dirname + "/../native"
    env.ACE_LIBRARY_PATH = nativePath

    switch (variant) {
        case 'java': {
            vm = 1
            classPath = __dirname + "/../out/java-subset/bin"
            break
        }
        case 'panda': {
            vm = 2
            classPath = __dirname + "/../external/arkoala-arkts/framework/build/abc/trivial"
            break
        }
        case 'es2panda': {
            vm = 3
            return runEs2PandaMain(nativePath)
        }
    }
    let result = nativeModule()._LoadVirtualMachine(vm, classPath, nativePath)

    if (result == 0) {
        rootPointer = nativeModule()._StartApplication("LoaderApp", "LoaderAppParams");
        setTimeout(async () => runEventLoop(), 0)
    } else {
        throw new Error(`Cannot start VM: ${result}`)
    }

    return result
}

if (isMainThread) {
    checkLoader(process.argv.length >= 1 ? process.argv[process.argv.length - 1] : "java")
} else {
    initWorker()
}