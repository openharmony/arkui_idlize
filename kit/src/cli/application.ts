/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { isMainThread, MessageChannel, Worker, workerData, MessagePort, threadId } from "node:worker_threads"
import { output } from "./systems/output.js"
import { runSystem, SystemResponse, SystemResponseFail, SystemMessage, SystemMessageKind, SystemMessageWrite } from "./system.js"
import { RmOptions, Stats } from "node:fs"
import { ExecOptions } from "node:child_process"

export interface MkdirOptions {
    recursive: boolean
}
export interface RealWorld {
    readFile(path: string): Promise<string>
    writeFile(path: string, data: string): Promise<void>
    log(msg: string, options?:SystemMessageWrite['options']): Promise<void>
    wait(ms: number): Promise<void>
    readdir(filePath: string): Promise<string[]>
    exists(filePath: string): Promise<boolean>
    stat(filePath:string): Promise<Stats>
    scan(rootPath:string): Promise<string[]>
    mkdir(path:string, options?: MkdirOptions): Promise<void>
    exec(command:string, options?:ExecOptions): Promise<[string, string]>
    cp(source:string, destination:string): Promise<true>
    rm(filePath:string, options?:RmOptions): Promise<true>
}

////////////////////////////////////////////////////////////////////////

abstract class ReadWorldOperations implements RealWorld {
    protected abstract querySystem(message: SystemMessage): Promise<any>
    protected abstract getClaim(): string

    readFile(fileName: string): Promise<string> {
        return this.querySystem({
            kind: SystemMessageKind.READFILE,
            claim: this.getClaim(),
            fileName
        })
    }
    writeFile(fileName: string, content: string): Promise<void> {
        return this.querySystem({
            kind: SystemMessageKind.WRITEFILE,
            claim: this.getClaim(),
            fileName,
            content,
        })
    }
    log(message: string, options?:SystemMessageWrite['options']): Promise<void> {
        return this.querySystem({
            kind: SystemMessageKind.WRITE,
            claim: this.getClaim(),
            message,
            options,
        })
    }
    wait(ms: number): Promise<void> {
        return this.querySystem({
            kind: SystemMessageKind.WAIT,
            claim: this.getClaim(),
            ms,
        })
    }
    readdir(fileName: string): Promise<string[]> {
        return this.querySystem({
            kind: SystemMessageKind.READDIR,
            claim: this.getClaim(),
            fileName,
        })
    }
    exists(fileName: string): Promise<boolean> {
        return this.querySystem({
            kind: SystemMessageKind.EXISTS,
            claim: this.getClaim(),
            fileName,
        })
    }
    stat(fileName: string): Promise<Stats> {
        return this.querySystem({
            kind: SystemMessageKind.STAT,
            claim: this.getClaim(),
            fileName
        })
    }
    scan(fileName: string): Promise<string[]> {
        return this.querySystem({
            kind: SystemMessageKind.SCAN,
            claim: this.getClaim(),
            fileName
        })
    }
    mkdir(fileName: string, options?: MkdirOptions): Promise<void> {
        return this.querySystem({
            kind: SystemMessageKind.MKDIR,
            claim: this.getClaim(),
            recursive: options?.recursive ?? false,
            fileName,
        })
    }
    exec(command: string, options?: ExecOptions): Promise<[string, string]> {
        return this.querySystem({
            kind: SystemMessageKind.EXEC,
            claim: this.getClaim(),
            command,
            options,
        })
    }
    cp(source: string, destination: string): Promise<true> {
        return this.querySystem({
            kind: SystemMessageKind.COPY,
            claim: this.getClaim(),
            fromPath: source,
            toPath: destination,
        })
    }
    rm(filePath: string, options?: RmOptions): Promise<true> {
        return this.querySystem({
            kind: SystemMessageKind.REMOVE,
            claim: this.getClaim(),
            fileName: filePath,
            options
        })
    }
}

class ProxyRealWorld extends ReadWorldOperations {
    protected override querySystem(message: SystemMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            runSystem(message, r => {
                if (r.ok) {
                    return resolve(r.data)
                }
                reject((r as SystemResponseFail).reason)
            })
        })
    }
    protected override getClaim() {
        return '__main_thread'
    }
}

class WorkerRealWorld extends ReadWorldOperations {

    constructor(
        private port: MessagePort
    ) { super() }

    private static IDX = 0
    protected override getClaim(): string {
        return threadId + "_" + WorkerRealWorld.IDX++
    }

    private pending = new Map<string, [(x: any) => void, (x: any) => void]>()
    private alreadyListens = false
    private listen() {
        const self = this
        function listen(msg: SystemResponse) {
            const handler = self.pending.get(msg.claim)
            if (handler) {
                const [resolve, reject] = handler
                if (msg.ok) {
                    resolve(msg.data)
                } else {
                    reject((msg as SystemResponseFail).reason)
                }
                self.pending.delete(msg.claim)
            }
            if (self.pending.size === 0) {
                self.port.off('message', listen)
                self.alreadyListens = false
            }
        }
        if (!this.alreadyListens) {
            this.port.on('message', listen)
            this.alreadyListens = true
        }
    }
    private registerPending(msg: SystemMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pending.set(msg.claim, [resolve, reject])
        })
    }
    protected override querySystem(msg: SystemMessage): Promise<any> {
        this.port.postMessage(msg)
        this.listen()
        return this.registerPending(msg)
    }
}

////////////////////////////////////////////////////////////////////////

interface WorkerDataBundle {
    communicationPort: MessagePort
    processArgs: string[]
    processEnv: NodeJS.ProcessEnv
}

export function application(app: string): void {
    if (!isMainThread) {
        throw new Error("Must be called only from main thread!")
    }

    const { port1, port2 } = new MessageChannel()
    const workerData: WorkerDataBundle = {
        communicationPort: port2,
        processArgs: getArgs(),
        processEnv: getEnv(),
    }
    const worker = new Worker(app, { workerData, transferList: [port2] })
    const stopInteraction = output.startInteractive()
    port1.on('message', (msg) => {
        runSystem(msg, r => port1.postMessage(r))
    })
    worker.on('exit', () => { stopInteraction() })
}
export function forkWith(app:() => void) {
    if (isMainThread) {
        const { port1, port2 } = new MessageChannel()
        const workerData: WorkerDataBundle = {
            communicationPort: port2,
            processArgs: getArgs(),
            processEnv: getEnv(),
        }
        const worker = new Worker(__filename, { workerData, transferList: [port2] })
        const stopInteraction = output.startInteractive()
        port1.on('message', (msg) => {
            runSystem(msg, r => port1.postMessage(r))
        })
        worker.on('error', (e) => {
            stopInteraction()
            throw e
        })
        worker.on('exit', (code) => {
            stopInteraction()
            process.exitCode = code
        })
    } else {
        app()
    }
}

let ioInstance: RealWorld | undefined = undefined
export function getIO(): RealWorld {
    const providedData = workerData as WorkerDataBundle
    if (!ioInstance) {
        if (isMainThread) {
            ioInstance = new ProxyRealWorld()
        } else {
            ioInstance = new WorkerRealWorld(providedData.communicationPort)
        }
    }
    return ioInstance
}

export function getArgs(): string[] {
    if (isMainThread) {
        return process.argv
    }
    return (workerData as WorkerDataBundle).processArgs
}

export function getEnv(): NodeJS.ProcessEnv {
     if (isMainThread) {
        return process.env
    }
    return (workerData as WorkerDataBundle).processEnv
}
