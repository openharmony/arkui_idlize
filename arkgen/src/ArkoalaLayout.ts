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

import * as fs from 'node:fs'
import * as path from 'node:path'
import { isMaterialized, Language, LayoutManagerStrategy, LayoutNodeRole, PeerLibrary } from '@idlizer/core'
import * as idl from '@idlizer/core'
import { isComponentDeclaration, NativeModule } from '@idlizer/libohos'

export const SyntheticModule = "./SyntheticDeclarations"
export function HandwrittenModule(language: Language) {
    switch (language) {
        case Language.TS: return "../handwritten"
        case Language.ARKTS: return "../handwritten"
        default: throw new Error("Not implemented")
    }
}

function toFileName(name:string) {
    return name.split(/[_-]/gi).map(it => idl.capitalize(it)).join('')
}

abstract class CommonLayoutBase implements LayoutManagerStrategy {
    constructor(
        protected library: PeerLibrary,
        protected prefix: string = "",
    ) {}
    abstract resolve(node: idl.IDLEntry, role: LayoutNodeRole): string

}

export class TsLayout extends CommonLayoutBase {
    private tsInternalPaths = new Map<string, string>([
        ["Serializer", "peers/Serializer"],
        ["Deserializer", "peers/Deserializer"],
        ["CallbackKind", "peers/CallbackKind"],
        ["deserializeAndCallCallback", "peers/CallbackDeserializeCall"],
        ["checkArkoalaCallbacks", "peers/CallbacksChecker"],
        ["CallbackTransformer", "peers/CallbackTransformer"],
    ])

    protected selectInterface(node: idl.IDLEntry): string {
        if (idl.isHandwritten(node)) {
            return HandwrittenModule(this.library.language)
        }
        const ns = idl.getNamespacesPathFor(node)
        if (ns.length) {
            return `${this.prefix}${idl.capitalize(ns[0].name)}Namespace`
        }
        if (idl.isSyntheticEntry(node)) {
            return SyntheticModule
        }
        if (idl.isInterface(node) && !isComponentDeclaration(this.library, node)) {
            if (idl.isBuilderClass(node)) {
                return `${this.prefix}${toFileName(node.name)}Builder`
            }
            if (isMaterialized(node, this.library)) {
                const name = node.name.endsWith('Internal') ? node.name.substring(0, node.name.length - 8) : node.name
                return `${this.prefix}${toFileName(name)}Materialized`
            }
        }
        let pureFileName = node.fileName
            ?.replaceAll('.d.ts', '')
            ?.replaceAll('.idl', '')
        if (pureFileName) {
            pureFileName = path.basename(pureFileName)
        }
        const entryName = pureFileName ?? node.name
        return `${this.prefix}${toFileName(entryName)}Interfaces`
    }

    protected selectPeer(node:idl.IDLEntry): string {
        if (idl.isInterface(node)) {
            if (isComponentDeclaration(this.library, node)) {
                return `peers/${this.prefix}${toFileName(node.name)}Peer`
            }
        }
        return `peers/${node.name}`
    }

    protected selectGlobal(node:idl.IDLEntry): string {
        const ns = idl.getNamespacesPathFor(node)
        if (ns.length) {
            return `${this.prefix}${idl.capitalize(ns[0].name)}Namespace`
        }
        return `GlobalScope`
    }

    /////

    resolve(node: idl.IDLEntry, role: LayoutNodeRole): string {
        if (this.tsInternalPaths.has(node.name))
            return this.tsInternalPaths.get(node.name)!
        if (node.name === NativeModule.Generated.name)
            return `peers/${NativeModule.Generated.name}`
        switch (role) {
            case LayoutNodeRole.INTERFACE: return this.selectInterface(node)
            case LayoutNodeRole.PEER: return this.selectPeer(node)
            case LayoutNodeRole.GLOBAL: return this.selectGlobal(node)
        }
    }
}

export class ArkTsLayout extends TsLayout {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TypeChecker", "#components"]
    ])
    // replace point symbol inside names, but not when it is a part of path
    readonly replacePattern = /(\.)[^\.\/]/g
    resolve(node: idl.IDLEntry, role: LayoutNodeRole): string {
        if (node.name === NativeModule.Generated.name)
            return `#components`
        if (this.arkTSInternalPaths.has(node.name))
            return this.arkTSInternalPaths.get(node.name)!
        return super.resolve(node, role)
    }
}

export class ArkTSComponentsLayout extends ArkTsLayout {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TSTypeChecker", "ts/type_check"],
        ["ArkTSTypeChecker", "arkts/type_check"],
    ])
    resolve(node: idl.IDLEntry, role: LayoutNodeRole): string {
        if (node.name === NativeModule.Generated.name)
            return `arkts/${NativeModule.Generated.name}`
        return super.resolve(node, role)
    }
}

export class JavaLayout extends CommonLayoutBase {
    constructor(library: PeerLibrary, prefix: string, private packagePath: string) {
        super(library, prefix)
    }
    private getPath(file:string):string {
        return path.join(this.packagePath, file)
    }
    resolve(node: idl.IDLNode, role: LayoutNodeRole): string {
        switch (role) {
            case LayoutNodeRole.INTERFACE: {
                if (idl.isEntry(node)) {
                    const ns = idl.getNamespaceName(node)
                    if (ns !== '') {
                        return this.getPath(`${this.prefix}${ns.split('.').map(it => idl.capitalize(it)).join('')}Namespace`)
                    }
                }
                if (idl.isInterface(node)) {
                    if (isComponentDeclaration(this.library, node)) {
                        return this.getPath(`${this.prefix}${toFileName(node.name)}`)
                    }
                    if (idl.isBuilderClass(node)) {
                        return this.getPath(`${this.prefix}${toFileName(node.name)}Builder`)
                    }
                    if (isMaterialized(node, this.library)) {
                        if (idl.isInterfaceSubkind(node)) {
                            return this.getPath(node.name + 'Internal')
                        }
                        return this.getPath(node.name)
                    }
                    return this.getPath(`${this.prefix}${toFileName(node.name)}Interfaces`)
                }
                return this.getPath(`Common`)
            }
            case LayoutNodeRole.PEER: {
                if (idl.isInterface(node)) {
                    if (isComponentDeclaration(this.library, node)) {
                        return this.getPath(`peers/${this.prefix}${toFileName(node.name)}Peer`)
                    }
                    return this.getPath(toFileName(node.name))
                }
                return this.getPath(`CommonPeer`)
            }
            case LayoutNodeRole.GLOBAL: {
                return 'GlobalScope'
            }
        }
    }
}

export class CJLayout extends CommonLayoutBase {
    private getPath(file:string):string {
        return path.join('.', file)
    }
    resolve(node: idl.IDLNode, role: LayoutNodeRole): string {
        switch (role) {
            case LayoutNodeRole.INTERFACE: {
                if (idl.isEntry(node)) {
                    const ns = idl.getNamespaceName(node)
                    if (ns !== '') {
                        return this.getPath(`${this.prefix}${ns.split('.').map(it => idl.capitalize(it)).join('')}Namespace`)
                    }
                }
                if (idl.isInterface(node)) {
                    if (isComponentDeclaration(this.library, node)) {
                        return this.getPath(`${this.prefix}${toFileName(node.name)}`)
                    }
                    if (idl.isBuilderClass(node)) {
                        return this.getPath(`${this.prefix}${toFileName(node.name)}Builder`)
                    }
                    if (isMaterialized(node, this.library)) {
                        if (idl.isInterfaceSubkind(node)) {
                            return this.getPath(toFileName(node.name) + 'Internal')
                        }
                        return this.getPath(toFileName(node.name))
                    }
                    return this.getPath(`${this.prefix}${toFileName(node.name)}Interfaces`)
                }
                return this.getPath(`Common`)
            }
            case LayoutNodeRole.PEER: {
                if (idl.isInterface(node)) {
                    if (isComponentDeclaration(this.library, node)) {
                        return this.getPath(`peers/${this.prefix}${toFileName(node.name)}Peer`)
                    }
                }
                return this.getPath(`CommonPeer`)
            }
            case LayoutNodeRole.GLOBAL: {
                return 'GlobalScope'
            }
        }
    }
}

////////////////////////////////////////////////////////

export function arkoalaLayout(library: PeerLibrary, prefix: string = '', packagePath: string = ''): LayoutManagerStrategy {
    switch(library.language) {
        case idl.Language.TS: return new TsLayout(library, prefix)
        case idl.Language.ARKTS: return new ArkTsLayout(library, prefix)
        case idl.Language.JAVA: return new JavaLayout(library, prefix, packagePath)
        case idl.Language.CJ: return new CJLayout(library, prefix)
    }
    throw new Error(`Unimplemented language "${library.language}"`)
}
