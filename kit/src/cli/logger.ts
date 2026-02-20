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

import { getEnv, getIO } from "./application.js";

type ToUnion<Ts> = Ts extends readonly [infer H, ...infer Rest] ? H | ToUnion<Rest> : never

const io = getIO()
const env = getEnv()

const logLevel = [
    'debug',
    'info',
    'warning',
    'error'
] as const
export type LogLevel = ToUnion<typeof logLevel>

class Logger {

    constructor(
        private level: LogLevel,
        private tabs: number = 0
    ) { }

    private decorate(message: string): string {
        return '..'.repeat(this.tabs) + (this.tabs > 0 ? ' ' : '') + message
    }
    private print(level: LogLevel, message: string, prompt?: { symbol: string, color: number }) {
        if (logLevel.indexOf(level) >= logLevel.indexOf(this.level)) {
            return io.log(this.decorate(message), { prompt })
        }
        return Promise.resolve()
    }

    group(op: (logger: Logger) => void) {
        op(new Logger(this.level, this.tabs + 1))
    }
    debug(...message: string[]) {
        this.print('debug', message.join(' '), { symbol: '-', color: 30 })
    }
    info(...message: string[]) {
        this.print('info', message.join(' '), { symbol: '>', color: 34 })
    }
    error(...message: string[]) {
        this.print('error', message.join(' '), { symbol: '#', color: 31 })
    }
}

function levelFromEnv(): LogLevel | undefined {
    if (!env.IDLIZER_LOG_LEVEL) {
        return undefined
    }
    return logLevel.includes(env.IDLIZER_LOG_LEVEL as LogLevel)
        ? env.IDLIZER_LOG_LEVEL as LogLevel
        : undefined
}

export const CURRENT_LOG_LEVEL = levelFromEnv() ?? 'info'
export const logger = new Logger(CURRENT_LOG_LEVEL)
