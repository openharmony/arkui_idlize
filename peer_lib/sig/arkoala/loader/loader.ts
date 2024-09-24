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

import { Worker, isMainThread, parentPort } from "node:worker_threads"

type int32 = number

export interface LoaderOps {
    _LoadVirtualMachine(vmKind: int32, appClassPath: string, appLibPath: string): int32
    _StartApplication(): int32
    _RunApplication(arg0: int32, arg1: int32): int32
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void
}

let theModule: LoaderOps | undefined = undefined

declare const LOAD_NATIVE: LoaderOps

export function callCallback(id: int32, args: Uint8Array, length: int32): int32 {
   console.log("Called callCallback()")
   throw new Error("Not yet implemented")
}

export function nativeModule(): LoaderOps {
    if (theModule) return theModule
    theModule = LOAD_NATIVE as LoaderOps
    if (!theModule)
        throw new Error("Cannot load native module")
    theModule._SetCallbackDispatcher(callCallback)
    return theModule
}

function waitVSync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100) )
}

export async function runEventLoop() {
    for (let i = 0; i < 5; i++) {
        nativeModule()._RunApplication(i, i * i)
        await waitVSync()
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

    switch (variant) {
        case 'java': {
            vm = 1
            classPath = __dirname + "/../out/java-subset/bin"
            break
        }
        case 'panda': {
            vm = 2
            classPath = __dirname + "/../build/abc/subset/sig/arkoala-arkts/arkui/src/generated"
            break
        }
        case 'es2panda': {
            vm = 3
            return runEs2PandaMain(nativePath)
        }
    }
    let result = nativeModule()._LoadVirtualMachine(vm, classPath, nativePath)

    if (result == 0) {
        nativeModule()._StartApplication();
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