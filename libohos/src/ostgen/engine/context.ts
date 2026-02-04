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

import { PeerLibrary } from "@idlizer/core";
import * as idl from "@idlizer/core/idl"
import { lw } from "../../ost";
import { HistoryTracker } from "./history";
import { OhosProducer, OhosSeed } from "../seed";
import { terminate } from "@idlizer/kit";

export class IDLTypeResolver {
    constructor(private resolver: PeerLibrary) {}

    toDeclaration(ref: idl.IDLReferenceType) {
        return this.resolver.resolveTypeReference(ref)
    }
}

export class MakeResult {
    constructor(
        private result: ProducerDescription
    ) { }

    private asTerminal(r: ProducerDescription): TerminalProducerDescription {
        if (!isTerminal(r)) {
            throw new Error(`Called asTerminal on a "${getKind(this.result)}"`)
        }
        return r
    }

    reference() {
        const target = this.asTerminal(this.result).artifact.reference
        if (!target) {
            throw new Error("Undefined reference target")
        }
        if (![
            lw.LWKind.ValueType,
            lw.LWKind.FunctionalType,
        ].includes(target.kind)) {
            throw new Error("Reference target must be a type")
        }
        return target as lw.LWType
    }
    name() {
        const target = this.asTerminal(this.result).artifact.reference
        if (!target) {
            throw new Error("Undefined name target")
        }
        if (![
            lw.LWKind.VariableExpression,
            lw.LWKind.ConstantExpression,
            lw.LWKind.StringExpression,
            lw.LWKind.UnaryExpression,
            lw.LWKind.BinaryExpression,
            lw.LWKind.CallExpression,
            lw.LWKind.AccessorExpression,
            lw.LWKind.ConstructorExpression,
        ].includes(target.kind)) {
            throw new Error("Name target must be an expression")
        }
        return target as lw.LWExpression
    }
}


export interface MiddlewareProducerDescription {
    go: () => void
}
export interface TerminalProducerDescription {
    artifact: {
        reference: lw.LWStatement | lw.LWExpression | lw.LWType
        implementationGenerator?: () => lw.LWDeclaration[]
    }
}
export interface RedirectProducerDescription {
    redirectTo: MakeSelectorQuery
}
export interface RecursiveProducerDescription {
    recursive: () => ProducerDescription
}

export type ProducerDescription =
    MiddlewareProducerDescription
    | TerminalProducerDescription
    | RedirectProducerDescription
    | RecursiveProducerDescription

function isMiddleware(desc: ProducerDescription): desc is MiddlewareProducerDescription {
    return "go" in desc
}
function isTerminal(desc: ProducerDescription): desc is TerminalProducerDescription {
    return "artifact" in desc
}
function isRedirect(desc: ProducerDescription): desc is RedirectProducerDescription {
    return "redirectTo" in desc
}
function isRecursive(desc: ProducerDescription): desc is RecursiveProducerDescription {
    return "recursive" in desc
}

function getKind(desc: ProducerDescription) {
    if (isMiddleware(desc)) {
        return 'middleware'
    }
    if (isTerminal(desc)) {
        return 'terminal'
    }
    if (isRedirect(desc)) {
        return 'redirect'
    }
    if (isRecursive(desc)) {
        return 'recursive'
    }
    return 'unknown'
}

// export interface Producer<N extends idl.IDLNode = idl.IDLNode> {
//     (node: N, ctx: GeneratorContext, query: MakeSelectorQuery): ProducerDescription
// }

export interface ProducerBox<N extends idl.IDLNode> {
    pattern: MakeSelectorPattern<N>
    producer: OhosProducer<N>
}

export function createProducer<N extends idl.IDLNode>(pattern: MakeSelectorPattern<N>, producer: OhosProducer<N>): ProducerBox<N> {
    return {
        pattern,
        producer,
    }
}

export interface MakeSelectorQuery {
    node: idl.IDLNode,
    role?: string
}
export interface MakeSelectorPattern<N extends idl.IDLNode> {
    is: (node: idl.IDLNode) => node is N,
    role?: string
}

// export class SelectError extends Error {}

export class MakeSelector {
    private readonly storage: ProducerBox<idl.IDLNode>[] = []

    register<N extends idl.IDLNode>(box: ProducerBox<N>) {
        this.storage.push(box as any)
    }

    select(seed: OhosSeed): OhosProducer<idl.IDLNode> {
        const record = this.storage.find(it => {
            if (!it.pattern.is(seed.node)) {
                return false
            }
            if (it.pattern.role === undefined) {
                return true
            }
            const queryRole = seed.role ?? ''
            return it.pattern.role === queryRole
        })
        if (!record)
            terminate(`Can not process "${idl.getFQName(seed.node)}", ${idl.IDLKind[seed.node.kind]}, ${seed.role}`)
        return record.producer
    }

    static create() {
        return new MakeSelector()
    }
}

interface GeneratorContextQueueItem {
    generator: TerminalProducerDescription['artifact']['implementationGenerator']
    history: HistoryTracker
}

// export class GeneratorContext {
//     public resolver: IDLTypeResolver

//     private storage = new Map<string, TerminalProducerDescription>()
//     private generatingQueue: GeneratorContextQueueItem[] = []

//     private renderContext = false
//     private historyContext = HistoryTracker.create('<root>')

//     constructor(
//         public library: PeerLibrary,
//         private selector: MakeSelector,
//     ) {
//         this.resolver = new IDLTypeResolver(library)
//     }

//     private getUseKeyFromNode(node: idl.IDLNode): string {
//         if (idl.isFile(node)) {
//             return node.fileName ?? 'no file???'
//         }
//         if (idl.isEntry(node)) {
//             return idl.getFQName(node)
//         }
//         if (idl.isType(node)) {
//             if (idl.isReferenceType(node)) {
//                 return node.name
//             }
//             if (idl.isPrimitiveType(node)) {
//                 return node.name
//             }
//             if (idl.isContainerType(node)) {
//                 return '#' + node.containerKind + '#' + node.elementType.map(t => this.getUseKey({ node: t })).join('::')
//             }
//             if (idl.isUnionType(node)) {
//                 return node.types.map(it => '|' + this.getUseKey({ node: it })).join('')
//             }
//             throw new Error(`Can not process "${idl.DebugUtils.debugPrintType(node)}"`)
//         }
//         throw new Error("???")
//     }
//     private getUseKey(query: MakeSelectorQuery): string {
//         const nodeKey = this.getUseKeyFromNode(query.node)
//         return nodeKey + '$$$' + (query.role ?? '<no role>')
//     }
//     private runUse(query: MakeSelectorQuery): ProducerDescription {
//         if (!this.renderContext) {
//             throw new Error("Can not use here!")
//         }
//         const key = this.getUseKey(query)
//         if (this.storage.has(key)) {
//             return this.storage.get(key)!
//         }
//         try {
//             const producer = this.selector.select(query)
//             this.renderContext = false
//             const desc = producer(query.node, this, query)
//             this.renderContext = true
//             return this.resolveDescription(key, desc, query.node)
//         } catch (ex) {
//             if (ex instanceof SelectError) {
//                 console.error("Selector was not found!")
//                 this.historyContext.follow((line) => {
//                     console.error(`  was working with "${line}"`)
//                 })
//             }
//             throw ex
//         }
//     }
//     private resolveDescription(key: string, desc: ProducerDescription, referenceNode:idl.IDLNode): ProducerDescription {
//         if (isTerminal(desc)) {
//             if (desc.artifact.implementationGenerator) {
//                 this.generatingQueue.push({
//                     generator: desc.artifact.implementationGenerator,
//                     history: this.historyContext.push(this.nodeName(referenceNode))
//                 })
//             }
//             this.storage.set(key, desc)
//             return desc
//         }
//         if (isMiddleware(desc)) {
//             desc.go()
//             return desc
//         }
//         if (isRedirect(desc)) {
//             const rec = this.runUse(desc.redirectTo)
//             if (isTerminal(rec)) {
//                 this.storage.set(key, rec)
//             }
//             return rec
//         }
//         if (isRecursive(desc)) {
//             return this.resolveDescription(key, desc.recursive(), referenceNode)
//         }
//         throw new Error("Unknown kind!")
//     }
//     private nodeName(node: idl.IDLNode): string {
//         return idl.isUnionType(node) ? "(union)" : idl.getFQName(node)
//     }

//     use(query: MakeSelectorQuery): MakeResult {
//         return new MakeResult(this.runUse(query))
//     }

//     generate(nodes: idl.IDLNode[]): lw.LWDeclaration[] {
//         const declarations: lw.LWDeclaration[] = []
//         this.renderContext = true
//         nodes.forEach(node => this.runUse({ node }))
//         this.renderContext = false
//         while (this.generatingQueue.length) {
//             const item = this.generatingQueue.shift()!
//             this.renderContext = true
//             this.historyContext = item.history
//             const decls = item.generator?.() ?? []
//             this.renderContext = false
//             declarations.push(...decls)
//         }
//         return declarations
//     }
// }
