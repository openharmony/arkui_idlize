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

import { getFQName, IDLEntry, IDLKind, isCallback, isEnum, isInterface, toIDLString } from "@idlizer/core/idl";

class Block {
    constructor(
        public text: string
    ) { }

    append(text: string) {
        this.text += text + '\n'
    }
}

class MdWriter {
    private mdBlocks: Block[] = []

    title(text: string, level: 1 | 2 | 3 = 1): Block {
        return this.push('#'.repeat(level) + ' ' + text)
    }
    push(chunk: string): Block {
        const block = new Block(chunk)
        this.mdBlocks.push(block)
        return block
    }
    paragraph(text?: string): Block {
        return this.push(text ?? '')
    }

    render(): string {
        return this.mdBlocks.map(block => block.text).join('\n\n')
    }

    static code(text: string): string {
        return `\`${text}\``
    }
    static bold(text: string): string {
        return `**${text}**`
    }
}

export class Tracker {
    private visited = new Set<IDLEntry>()

    private isPrinted(entry: IDLEntry): boolean {
        return this.visited.has(entry)
    }

    track(entry: IDLEntry) {
        this.visited.add(entry)
    }

    private printProgressBar(total: number, current: number, name?: string) {
        const barSym = '#'
        const barLength = 20
        const proc = Math.round((current / total) * 100)
        let bar = name ? name.padEnd(12, ' ') : ''
        bar += '['
        const ptr = Math.round((current / total) * 20)
        for (let i = 0; i < barLength; ++i) {
            if (i < ptr) {
                bar += barSym
            } else {
                bar += '.'
            }
        }
        bar += '] ' + proc + '%'

        return bar
    }

    prepareReport(title: string, entries: IDLEntry[]) {
        let stats = {
            interfaces: {
                implemented: 0,
                total: 0
            },
            enums: {
                implemented: 0,
                total: 0
            },
            methods: {
                implemented: 0,
                total: 0
            },
            others: {
                implements: 0,
                total: 0
            }
        }

        const writer = new MdWriter()
        writer.title(title)

        writer.title('Status', 2)
        const status = writer.paragraph()
        writer.title('Table of content', 2)
        const content = writer.paragraph()
        writer.title('Content', 2)

        entries.forEach(entry => {
            if (isInterface(entry)) {
                stats.interfaces.total += 1
            } else if (isEnum(entry)) {
                stats.enums.total += 1
            } else {
                stats.others.total += 1
            }
            let isPrinted = this.isPrinted(entry)
            if (isPrinted) {
                if (isInterface(entry)) {
                    stats.interfaces.implemented += 1
                } else if (isEnum(entry)) {
                    stats.enums.implemented += 1
                } else {
                    stats.others.implements += 1
                }
            }

            const titleBlock = writer.paragraph()

            let isPartial = false
            if (isInterface(entry)) {
                const methodsText = writer.paragraph()
                const members: IDLEntry[] = []
                members.concat(entry.methods).concat(entry.properties).forEach(member => {
                    stats.methods.total += 1
                    const isImplemented = this.isPrinted(member)
                    const status = isImplemented ? `✅` : '✖️'
                    methodsText.append(`+ ${status} \`${toIDLString(member, { oneLine: true })}\``)
                    if (isImplemented) {
                        stats.methods.implemented += 1
                    } else {
                        isPartial = true
                    }
                })
            }

            let status = isPrinted ? isPartial ? '🟡' : `✅` : '✖️'
            const titleName = `**${IDLKind[entry.kind]}** \`${getFQName(entry)}\``
            const title = `${status} ${titleName}`
            content.append(`+ ${title}`)
            titleBlock.text = '### ' + title
        })

        const overallImplemented =
            stats.enums.implemented
            + stats.interfaces.implemented
            + stats.methods.implemented
        const overallTotal =
            stats.enums.total
            + stats.interfaces.total
            + stats.methods.total

        status.append('````')
        status.append('TOTAL: ' + overallTotal)
        status.append('IMPLEMENTED: ' + overallImplemented)
        status.append('````')
        status.append('````')
        status.append(this.printProgressBar(overallTotal, overallImplemented, 'OVERALL'))
        status.append(this.printProgressBar(stats.interfaces.total, stats.interfaces.implemented, 'INTERFACES'))
        status.append(this.printProgressBar(stats.enums.total, stats.enums.implemented, 'ENUMS'))
        status.append(this.printProgressBar(stats.methods.total, stats.methods.implemented, 'METHODS'))
        status.append('````')

        return writer.render()
    }
}
