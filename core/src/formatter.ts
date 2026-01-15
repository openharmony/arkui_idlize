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

import { DiagnosticResults, MessageSeverityList, DiagnosticMessage, Range } from "./diagnostictypes"

type Logger = (...msg:string[]) => void

let logger: Logger = (...msg) => console.log(...msg)

export function setFormatterLogger(log:Logger) {
    logger = log
}

export function outputDiagnosticResultsFormatted(result: DiagnosticResults): void {
    for (let message of result.entries) {
        outputDiagnosticMessageFormatted(message)
    }
    outputReadableTotals(result)
}

function outputReadableTotals(result: DiagnosticResults): void {
    let totals: string[] = []
    for (let k of MessageSeverityList) {
        totals.push(`${k}: ${result.totals[k]}`)
    }
    logger(totals.join(", "))
}

function lineDigitCount(message: DiagnosticMessage): number {
    let count = 0
    for (let part of message.parts) {
        let range = part.location.range
        if (range == null) {
            continue
        }
        count = Math.max(count, range.start.line.toString().length, range.end.line.toString().length)
    }
    return count
}

function paddedLineNo(digits: number, line: number): string {
    let s = line.toString()
    if (s.length < digits) {
        return " ".repeat(digits - s.length) + s
    }
    return s
}

function formatLine(digits: number, lines: string[], lineNo: number): string {
    return `${paddedLineNo(digits, lineNo)} | ${lines[lineNo-1]}`
}

function formatUnderline(indent: string, lines: string[], lineNo: number, range: Range, edgeChar: string, midChar: string, message: string): string {
    if (lineNo == range.start.line && lineNo == range.end.line) {
        let len = range.end.character - range.start.character + 1
        return `${indent} | ${" ".repeat(range.start.character - 1)}${edgeChar}${len > 2 ? midChar.repeat(len - 2) : ""}${len > 1 ? edgeChar : ""} ${message}`
    }
    if (lineNo == range.start.line) {
        let len = lines[lineNo-1].length - range.start.character
        return `${indent} | ${" ".repeat(range.start.character - 1)}${edgeChar}${len > 1 ? midChar.repeat(len - 1) : ""}`
    }
    if (lineNo == range.end.line) {
        let len = range.end.character
        return `${indent} | ${len > 1 ? midChar.repeat(len - 1) : ""}${edgeChar} ${message}`
    }
    return `${indent} | ${midChar.repeat(lines[lineNo-1].length)}`
}

export function outputDiagnosticMessageFormatted(message: DiagnosticMessage): void {
    if (message.parts.length == 0) {
        return
    }
    logger(`${message.severity}[${message.code}]: ${message.codeDescription}`)
    let digits = lineDigitCount(message)
    let indent = " ".repeat(digits)
    let first: boolean = true
    let lastPath: string = ""
    for (let part of message.parts) {
        const location = part.location
        if (location.range != null && location.lines != null) {
            let range = location.range
            let lines = location.lines
            logger(`${indent}${lastPath != part.location.documentPath ? "-->" : ":::"} ${part.location.documentPath}:${range.start.line}:${range.start.character}`)
            logger(`${indent} |`)
            const last = Math.min(range.end.line + 1, lines.length - 1)
            for (let i = Math.max(range.start.line - 1, 1); i <= last; ++i) {
                logger(formatLine(digits, lines, i))
                if (i >= range.start.line && i <= range.end.line) {
                    logger(formatUnderline(indent, lines, i, range, "^", first ? "-" : "~", part.message))
                }
            }
        } else {
            logger(`${indent}--> ${part.location.documentPath}`)
            if (message.parts.length > 1) {
                logger(`${indent} # ${part.message}`)
            }
        }
        first = false
        lastPath = part.location.documentPath
    }
    logger(`${indent} = ${message.parts[0].message}`)
    logger()
}
