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
    abstract resolve(target: idl.LayoutTargetDescription): string

}

export class TsLayout extends CommonLayoutBase {
    private tsInternalPaths = new Map<string, string>([
        ["Serializer", "peers/Serializer"],
        ["Deserializer", "peers/Deserializer"],
        ["CallbackKind", "peers/CallbackKind"],
        ["deserializeAndCallCallback", "peers/CallbackDeserializeCall"],
        ["checkArkoalaCallbacks", "../CallbacksChecker"],
        ["CallbackTransformer", "../CallbackTransformer"],
    ])

    resolve(target: idl.LayoutTargetDescription): string {
        if (this.tsInternalPaths.has(target.node.name))
            return this.tsInternalPaths.get(target.node.name)!
        if (target.node.name === NativeModule.Generated.name)
            return `peers/${NativeModule.Generated.name}`
        if (idl.isHandwritten(target.node)) {
            return HandwrittenModule(this.library.language)
        }
        // if (idl.isSyntheticEntry(target.node)) {
        //     return SyntheticModule
        // }
        if (idl.isInterface(target.node) && !isComponentDeclaration(this.library, target.node)) {
            // TODO currently rollup can wrongly order some declarations if all of them will be placed in common
            // files (button.ts, text_input.ts). So, materialized/builders were moved to ArkSmthMaterialized to resolve
            // that problem. That is just a hack and ideal solution will be to fix dependencies graph cycles
            if (idl.isBuilderClass(target.node)) {
                return `${this.prefix}${toFileName(target.node.name)}Builder`
            }
            if (isMaterialized(target.node, this.library)) {
                const packageClause = idl.getPackageClause(target.node).join('.')
                return packageClause
            }
        }
        let pureFileName = idl.getFileFor(target.node)?.fileName
            ?.replaceAll('.d.ts', '')
            ?.replaceAll('.idl', '')
            ?.replaceAll('@', '')
        if (pureFileName) {
            pureFileName = path.basename(pureFileName)
        }
        const entryName = pureFileName ?? target.node.name
        return entryName
    }
}

class ArkTsLayout extends CommonLayoutBase {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TypeChecker", "#components"],
        ["Serializer", "peers/Serializer"],
        ["Deserializer", "peers/Deserializer"],
        ["CallbackKind", "peers/CallbackKind"],
        ["deserializeAndCallCallback", "peers/CallbackDeserializeCall"],
        ["checkArkoalaCallbacks", "../CallbacksChecker"],
        ["CallbackTransformer", "../CallbackTransformer"],
    ])
    // replace point symbol inside names, but not when it is a part of path
    readonly replacePattern = /(\.)[^\.\/]/g
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.node.name === NativeModule.Generated.name)
            return `#components`
        if (this.arkTSInternalPaths.has(target.node.name))
            return this.arkTSInternalPaths.get(target.node.name)!

        if (idl.isHandwritten(target.node)) {
            return HandwrittenModule(this.library.language)
        }
        let pureFileName = idl.getFileFor(target.node)?.fileName
            ?.replaceAll('.d.ts', '')
            ?.replaceAll('.idl', '')
        if (pureFileName) {
            pureFileName = path.basename(pureFileName)
        }
        const entryName = pureFileName ?? target.node.name
        return entryName
    }
}

export class ArkTSComponentsLayout extends ArkTsLayout {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TSTypeChecker", "ts/type_check"],
        ["ArkTSTypeChecker", "arkts/type_check"],
    ])
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.node.name === NativeModule.Generated.name)
            return `arkts/${NativeModule.Generated.name}`
        return super.resolve(target)
    }
}

export class JavaLayout extends CommonLayoutBase {
    constructor(library: PeerLibrary, prefix: string, private packagePath: string) {
        super(library, prefix)
    }
    private getPath(file:string):string {
        return path.join(this.packagePath, file)
    }
    resolve({ node, role }: idl.LayoutTargetDescription): string {
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
            case LayoutNodeRole.COMPONENT: {
                return 'Ark' + node.name
            }
        }
    }
}

export class CJLayout extends CommonLayoutBase {
    private getPath(file:string):string {
        return path.join('.', file)
    }
    resolve({ node, role }: idl.LayoutTargetDescription): string {
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
            case LayoutNodeRole.COMPONENT: {
                return 'Ark' + node.name
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
