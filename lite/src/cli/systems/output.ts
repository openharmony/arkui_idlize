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

interface BufferedMessage {
    text?: string
    prompt?: {
        symbol: string
        color: number
    }
}

const BUFFER: BufferedMessage[] = []
const DEFAULT_PROMPT_SYMBOL = '>'

let currentFrame = 0
let capturedMessage: BufferedMessage = {}
const SPINNER = [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏"
]

const FG_COLOR_MAP = new Map<number, number>([
    [30,30], // Black
    [31,31], // Red
    [32,32], // Green
    [33,33], // Yellow
    [34,34], // Blue
    [35,35], // Purple
    [36,36], // Cyan
    [37,37], // White
])
const BG_COLOR_MAP = new Map<number, number>([
    [40, 40], 	// Black
    [41, 41], 	// Red
    [42, 42], 	// Green
    [43, 43], 	// Yellow
    [44, 44], 	// Blue
    [45, 45], 	// Purple
    [46, 46], 	// Cyan
    [47, 47], 	// White
])

function processStyle(line:string, options?:OutputWriteOptions): string {
    if (!process.stdout.isTTY || options?.style === undefined || options?.style === 0) {
        return line
    }
    const fgColor = (options.style >> 0x00) & 0xFF
    const bgColor = (options.style >> 0x10) & 0xFF

    const fgColorMapped = FG_COLOR_MAP.get(fgColor)
    const bgColorMapped = BG_COLOR_MAP.get(bgColor)

    if (fgColorMapped === undefined || bgColorMapped === undefined) {
        return line
    }

    const prefix = `\x1b[${bgColorMapped};${fgColorMapped}m`
    const tabs = options.indent ? ' '.repeat(options.indent) : ''
    const clr = '\x1b[0m'

    return prefix + tabs + line + clr
}

export interface OutputWriteOptions {
    style?:number
    prompt?:BufferedMessage['prompt']
    indent?: number
}

function write(message:string, options?:OutputWriteOptions) {
    message.split('\n').forEach(line => {
        BUFFER.push({
            text: processStyle(line, options),
            prompt: options?.prompt === undefined ? undefined : { ...options.prompt }
        })
    })
}

function green(line:string): string {
    if (!process.stdout.isTTY) {
        return line
    }
    return '\x1b[32m' + line + '\x1b[0m'
}
function colorFromCode(code:number, line:string): string {
    if (!process.stdout.isTTY) {
        return line
    }
    return `\x1b[${code}m` + line + '\x1b[0m'
}

function startInteractive() {
    function flashCapturedMessage() {
        if (capturedMessage.text !== undefined) {
            const currentPrompt = capturedMessage?.prompt
            process.stdout.write(colorFromCode(currentPrompt?.color ?? 34, currentPrompt?.symbol ?? DEFAULT_PROMPT_SYMBOL) + ' ' + capturedMessage.text + '\n')
        }
        capturedMessage = {}
    }
    function roll(lastRound:boolean) {
        if (process.stdout.isTTY) {
            process.stdout.write('\x1b[2K\r')
        }
        while (BUFFER.length > 0) {
            flashCapturedMessage()
            const last = BUFFER.shift()!
            capturedMessage = last
        }
        if (!lastRound && process.stdout.isTTY) {
            process.stdout.write(green(SPINNER[currentFrame]) + ' ' + capturedMessage.text)
            currentFrame = (currentFrame + 1) % SPINNER.length
        } else {
            flashCapturedMessage()
        }
    }

    let online = true
    const loop = setInterval(() => roll(false), 128)
    return () => {
        if (!online) {
            return
        }
        online = false
        roll(true)
        process.stdout.write('\r')
        clearInterval(loop)
    }
}

export const output = {
    write,
    startInteractive
}
