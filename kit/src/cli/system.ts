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

import { access, cp, mkdir, readdir, readFile, rm, RmOptions, stat, writeFile } from "node:fs"
import { output, OutputWriteOptions } from "./systems/output.js"
import { F_OK } from "node:constants"
import { scan } from "./utils.js"
import { exec, ExecOptions } from "node:child_process"

export enum SystemMessageKind {
    WRITE,
    WRITEFILE,
    READFILE,
    WAIT,
    READDIR,
    EXISTS,
    STAT,
    SCAN,
    MKDIR,
    EXEC,
    COPY,
    REMOVE,
    SET_PROMPT,
}

export interface SystemMessageWrite {
    kind: SystemMessageKind.WRITE
    claim: string
    message: string
    options?: OutputWriteOptions
}
export interface SystemMessageWriteFile {
    kind: SystemMessageKind.WRITEFILE
    claim: string
    fileName: string
    content: string
}
export interface SystemMessageReadFile {
    kind: SystemMessageKind.READFILE
    claim: string
    fileName: string
}
export interface SystemMessageWait {
    kind: SystemMessageKind.WAIT
    claim: string
    ms: number
}
export interface SystemMessageReadDir {
    kind: SystemMessageKind.READDIR
    claim: string
    fileName: string
}
export interface SystemMessageExists {
    kind: SystemMessageKind.EXISTS
    claim: string
    fileName: string
}
export interface SystemMessageStat {
    kind: SystemMessageKind.STAT,
    claim: string
    fileName: string
}
export interface SystemMessageScan {
    kind: SystemMessageKind.SCAN,
    claim: string
    fileName: string
}
export interface SystemMessageMkdir {
    kind: SystemMessageKind.MKDIR
    recursive: boolean
    claim: string
    fileName: string
}
export interface SystemMessageExec {
    kind: SystemMessageKind.EXEC
    claim: string
    command: string
    options?: ExecOptions
}
export interface SystemMessageCopy {
    kind: SystemMessageKind.COPY
    claim: string
    fromPath: string
    toPath: string
}
export interface SystemMessageRemove {
    kind: SystemMessageKind.REMOVE
    claim: string
    fileName: string
    options?: RmOptions
}

export type SystemMessage =
      SystemMessageWrite
    | SystemMessageWriteFile
    | SystemMessageReadFile
    | SystemMessageWait
    | SystemMessageReadDir
    | SystemMessageExists
    | SystemMessageStat
    | SystemMessageScan
    | SystemMessageMkdir
    | SystemMessageExec
    | SystemMessageCopy
    | SystemMessageRemove

export interface SystemResponseOk {
    ok: true
    claim: string
    data: any
}
export interface SystemResponseFail {
    ok: false
    claim: string
    reason: any
}
export type SystemResponse =
    SystemResponseOk
    | SystemResponseFail

export function runSystem(message: SystemMessage, sendResult: (r: SystemResponse) => void): void {

    const answer = (data: any) => sendResult({ ok: true, claim: message.claim, data })
    const fail = (reason: any) => sendResult({ ok: false, claim: message.claim, reason })

    switch (message.kind) {
        case SystemMessageKind.WRITE: {
            output.write(message.message, message.options)
            sendResult({ ok: true, claim: message.claim, data: undefined })
            return
        }
        case SystemMessageKind.WRITEFILE: {
            writeFile(message.fileName, message.content, 'utf-8', err => {
                if (err) {
                    sendResult({ ok: false, claim: message.claim, reason: err })
                } else {
                    sendResult({ ok: true, claim: message.claim, data: undefined })
                }
            })
            return
        }
        case SystemMessageKind.READFILE: {
            readFile(message.fileName, 'utf-8', (err, data) => {
                if (err) {
                    sendResult({ ok: false, claim: message.claim, reason: err })
                } else {
                    sendResult({ ok: true, claim: message.claim, data })
                }
            })
            return
        }
        case SystemMessageKind.WAIT: {
            setTimeout(() => {
                sendResult({ ok: true, claim: message.claim, data: undefined })
            }, message.ms)
            return
        }
        case SystemMessageKind.READDIR: {
            readdir(message.fileName, (err, files) => {
                if (err) {
                    sendResult({ ok: false, claim: message.claim, reason: err })
                } else {
                    sendResult({ ok: true, claim: message.claim, data: files })
                }
            })
            return
        }
        case SystemMessageKind.EXISTS: {
            access(message.fileName, F_OK, err => {
                sendResult({ ok: true, claim: message.claim, data: !err })
            });
            return
        }
        case SystemMessageKind.STAT: {
            stat(message.fileName, (err, res) => {
                if (err) {
                    sendResult({ ok: false, claim: message.claim, reason: err })
                } else {
                    sendResult({ ok: true, claim: message.claim, data: res })
                }
            })
            return
        }
        case SystemMessageKind.SCAN: {
            scan(message.fileName)
                .then(res => sendResult({ ok: true, claim: message.claim, data: res }))
                .catch(err => sendResult({ ok: false, claim: message.claim, reason: err }))
            return
        }
        case SystemMessageKind.MKDIR: {
            mkdir(message.fileName, { recursive: message.recursive }, (err) => {
                if (err) {
                    sendResult({ ok: false, claim: message.claim, reason: err })
                } else {
                    sendResult({ ok: true, claim: message.claim, data: true })
                }
            })
            return
        }
        case SystemMessageKind.EXEC: {
            exec(message.command, message.options, (err, stdout, stderr) => {
                if (err) {
                    console.error(err, stdout, stderr)
                    fail(err)
                } else {
                    answer([stdout, stderr])
                }
            })
            return
        }
        case SystemMessageKind.COPY: {
            cp(message.fromPath, message.toPath, (err) => {
                if (err) {
                    fail(err)
                } else {
                    answer(true)
                }
            })
            return
        }
        case SystemMessageKind.REMOVE: {
            if (message.options) {
                rm(message.fileName, message.options, (err) => {
                    if (err) {
                        fail(err)
                    } else {
                        answer(true)
                    }
                })
            } else {
                rm(message.fileName, (err) => {
                    if (err) {
                        fail(err)
                    } else {
                        answer(true)
                    }
                })
            }
            return
        }
    }
}