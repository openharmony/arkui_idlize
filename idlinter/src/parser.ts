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

import * as fs from "fs"
import * as idl from "@idlizer/core"
import { DiagnosticException, Location, Range, commonRange } from  "./diagnostictypes"
import { LoadingError, ParsingError, UnknownError } from "./messages"

interface Webidl2Token {
    type: string
    value: string
    trivia: string
    line: number // 1 based
    index: number // in tokens
    position: number // 0 based from the beginning of file
}

interface Webidl2Error {
    /** the error message */
    message: string
    bareMessage: string
    /** the line at which the error occurred. */
    context: string
    line: number
    sourceName: string | undefined
    /** a short peek at the text at the point where the error happened */
    input: string
    /** the five tokens at the point of error, as understood by the tokeniser */
    tokens: Webidl2Token[]
}

// interface Webidl2ErrorData extends Webidl2Error {
//     /** the level of error */
//     level: "error" | "warning"
//     /** A function to automatically fix the error */
//     autofix?(): void
//     /** The name of the rule that threw the error */
//     ruleName: string
// }

export type AutoLocations = (Location | idl.IDLNode)[] | Location | idl.IDLNode

export class Parsed {
    fileName: string
    idlFile: idl.IDLFile
    lexicalInfo: idl.IDLTokenInfoMap
    content: string = ""
    lines: string[] = []
    offsets: number[] = []

    constructor(fileName: string) {
        this.fileName = fileName
        this.idlFile = idl.createFile([], this.fileName)
        this.lexicalInfo = new Map()
    }
    load(): void {
        try {
            this.content = fs.readFileSync(this.fileName).toString()
            let lines = this.content.match(/[^\r\n]*(\n|\r\n)?/g) as string[] ?? []
            this.offsets = prepareOffsets(lines)
            this.lines = lines.map((s) => s.replace(/(\n|\r\n)$/, ""))
        }  catch (e: any) {
            LoadingError.throwDiagnosticMessage([{documentPath: this.fileName}], e.message ?? "")
        }
        try {
            ;[this.idlFile, this.lexicalInfo] = idl.toIDLFile(this.fileName, {content: this.content})
            //;[this.idlFile, this.lexicalInfo] = idl.toIDLFile(this.fileName, {content: this.content, inheritanceMode: "single"})
        } catch (e: any) {
            if (e.name == "WebIDLParseError") {
                let tokens = (e as Webidl2Error).tokens
                let range = tokens.length > 0 ? rangeForToken(this.offsets, tokens[0]) : undefined
                ParsingError.throwDiagnosticMessage([{documentPath: this.fileName, range: range}], e.bareMessage)
            }
            UnknownError.throwDiagnosticMessage([{documentPath: this.fileName}], e.message ?? "")
        }
        // Provide full location tracking
        idl.forEachChild(this.idlFile, (n) => {
            (n as any)._parsed = this
        })
    }
}

export function rangeForToken(offsets: number[], token: Webidl2Token): Range {
    let dif = token.value.length - 1
    if (dif < 0) {
        dif = 0
    }
    let endline = token.line + (token.value.match(/\n/g)||[]).length
    let character = token.position - offsets[token.line - 1] + 1
    let endcharacter = token.position + dif - offsets[endline - 1] + 1
    return {start: {line: token.line, character: character}, end: {line: endline, character: endcharacter}}
}

export function rangeForNode(parsed: Parsed, node: idl.IDLNode, component?: string): Range|undefined {
    let info = parsed.lexicalInfo.get(node)
    if (info == null) {
        // console.log("node:")
        // console.log(node.kind)
        // console.log(JSON.stringify(Object.keys(node), null, 2))
        // console.log("parent:")
        // console.log(node.parent!.kind)
        // console.log(JSON.stringify(Object.keys(node.parent!), null, 2))
        // let info2 = parsed.lexicalInfo.get(node.parent!)
        // console.log(JSON.stringify(info2, null, 2))

        // Proper solution will require fixes with inheritance tokens in Idlize/core and custom webidl2.js
        // So now we are extracting from what we have
        if (node.parent) {
            return rangeForNode(parsed, node.parent, "inheritance") ?? rangeForNode(parsed, node.parent)
        }
        return
    }

    let range: Range|undefined
    for (let k of Object.keys(info)) {
        if (component && k != component) {
            continue
        }
        let named = info[k]
        if (named == null) {
            continue
        }
        if (named.value == null) {
            if (k == "inheritance" && Array.isArray(named)) {
                for (let inh of named) {
                    if (inh.inheritance == null) {
                        continue
                    }
                    let newRange = rangeForToken(parsed.offsets, inh.inheritance)
                    range = range ? commonRange(range, newRange) : newRange
                }
            }
            continue
        }
        let newRange = rangeForToken(parsed.offsets, named)
        range = range ? commonRange(range, newRange) : newRange
        
    }
    return range
}

export function locationForNode(node: idl.IDLNode, component?: string): Location {
    let parsed = (node as any)._parsed as Parsed
    if (parsed == null) {
        throw new Error("IDLNode without _parsed field!")
    }
    return {documentPath: parsed.fileName, range: rangeForNode(parsed, node, component)}
}

export function locationsFromAuto(autolocations: AutoLocations): Location[] {
    if (autolocations == null) {
        return []
    }
    if (Array.isArray(autolocations)){
        let res: Location[] = []
        for (let l of autolocations as any[]) {
            res.push(l.kind ? locationForNode(l) : l)
        }
        return res
    }
    return ((autolocations as any).kind ? [locationForNode(autolocations as any)] : [autolocations as any])
}

function prepareOffsets(lines: string[]): number[] {
    let offsets: number[] = []
    let offset = 0
    for (let line of lines) {
        let plus = line.length
        offsets.push(offset)
        offset += plus
    }
    return offsets
}
