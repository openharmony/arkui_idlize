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
import { isComponentDeclaration, NativeModule, peerGeneratorConfiguration } from '@idlizer/libohos'

const BASE_PATH = 'generated'
const getGeneratedFilePath = (p:string) => path.join(BASE_PATH, p)

export const SyntheticModule = "./SyntheticDeclarations"
export function HandwrittenModule(language: Language) {
    // does this switch needed here?
    switch (language) {
        case Language.TS: return "./handwritten"
        case Language.ARKTS: return "./handwritten"
        case Language.KOTLIN: return "./handwritten"
        default: throw new Error("Not implemented")
    }
}

function toFileName(name:string) {
    return name.split(/[_-]/gi).map(it => idl.capitalize(it)).join('')
}

function customPathSuggestion(pkg: string): string | undefined {
    const suggestions = peerGeneratorConfiguration().currentModulePackagesPaths
    if (!suggestions)
        return undefined
    if ([...suggestions.keys()].filter(it => pkg.startsWith(it)).length > 1)
        throw new Error(`Can not select appropriate prefix for package "${pkg}": found more that variants in "currentModulePackagesPaths"`)
    for (const prefix of suggestions.keys()) {
        if (pkg === prefix)
            return suggestions.get(prefix)
        if (pkg.startsWith(prefix))
            return path.join(suggestions.get(prefix)!, pkg.substring(prefix.length + 1))
    }
    return undefined
}

abstract class CommonLayoutBase implements LayoutManagerStrategy {
    constructor(
        protected library: PeerLibrary,
        protected prefix: string = "",
    ) {}
    abstract resolve(target: idl.LayoutTargetDescription): string
    handwrittenPackage(): string {
        return HandwrittenModule(this.library.language)
    }
}

function getModuleImport(node: idl.IDLNode, role: LayoutNodeRole): string | undefined {
    if (role == LayoutNodeRole.GLOBAL) return undefined
    if (idl.isInCurrentModule(node)) return undefined
    if (idl.isInExternalModule(node)) {
        if (role == LayoutNodeRole.SERIALIZER) return undefined
    }
    return `@${idl.getPackageName(node)}`
}

export class TsLayout extends CommonLayoutBase {
    private tsInternalPaths = new Map<string, string>([
        ["SerializerBase", "@koalaui/interop"],
        ["DeserializerBase", "@koalaui/interop"],
        ["CallbackKind", getGeneratedFilePath("peers/CallbackKind")],
        ["deserializeAndCallCallback", getGeneratedFilePath("peers/CallbackDeserializeCall")],
        ["checkArkoalaCallbacks", "./CallbacksChecker"],
        ["CallbackTransformer", "./CallbackTransformer"],
    ])

    resolve(target: idl.LayoutTargetDescription): string {
        if (this.tsInternalPaths.has(target.node.name))
            return this.tsInternalPaths.get(target.node.name)!
        if (target.node.name === NativeModule.Generated.name)
            return getGeneratedFilePath(`peers/${NativeModule.Generated.name}`)
        if (idl.isHandwritten(target.node) || peerGeneratorConfiguration().isHandWritten(target.node.name)) {
            return HandwrittenModule(this.library.language)
        }
        // if (idl.isSyntheticEntry(target.node)) {
        //     return SyntheticModule
        // }

        const moduleImport = getModuleImport(target.node, target.role)
        if (moduleImport) return moduleImport

        if (idl.isInterface(target.node) && !isComponentDeclaration(this.library, target.node)) {
            // TODO currently rollup can wrongly order some declarations if all of them will be placed in common
            // files (button.ts, text_input.ts). So, materialized/builders were moved to ArkSmthMaterialized to resolve
            // that problem. That is just a hack and ideal solution will be to fix dependencies graph cycles
            if (idl.isBuilderClass(target.node)) {
                return `${this.prefix}${toFileName(target.node.name)}Builder`
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
        return getGeneratedFilePath(entryName)
    }
}

class ArkTsLayout extends CommonLayoutBase {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TypeChecker", "#components"],
        ["SerializerBase", "@koalaui/interop"],
        ["DeserializerBase", "@koalaui/interop"],
        ["CallbackKind", getGeneratedFilePath("peers/CallbackKind")],
        ["deserializeAndCallCallback", getGeneratedFilePath("peers/CallbackDeserializeCall")],
        ["checkArkoalaCallbacks", "./CallbacksChecker"],
        ["CallbackTransformer", "./CallbackTransformer"],
    ])
    // replace point symbol inside names, but not when it is a part of path
    readonly replacePattern = /(\.)[^\.\/]/g
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.node.name === NativeModule.Generated.name)
            return `#components`
        if (this.arkTSInternalPaths.has(target.node.name))
            return this.arkTSInternalPaths.get(target.node.name)!

        if (idl.isHandwritten(target.node) || peerGeneratorConfiguration().isHandWritten(target.node.name)) {
            return HandwrittenModule(this.library.language)
        }
        const packageName = idl.getPackageName(target.node)

        const moduleImport = getModuleImport(target.node, target.role)
        if (moduleImport) return moduleImport

        let customPath: string | undefined
        if (packageName && (customPath = customPathSuggestion(packageName))) {
            return customPath
        }
        let pureFileName = idl.getFileFor(target.node)?.fileName
            ?.replaceAll('.d.ts', '')
            ?.replaceAll('.idl', '')
            ?.replaceAll('@', '')
        if (pureFileName) {
            pureFileName = path.basename(pureFileName)
        }
        const entryName = pureFileName ?? target.node.name
        return getGeneratedFilePath(entryName)
    }
}

export class ArkTSComponentsLayout extends ArkTsLayout {
    protected arkTSInternalPaths = new Map<string, string>([
        ["TSTypeChecker", getGeneratedFilePath("ts/type_check")],
        ["ArkTSTypeChecker", getGeneratedFilePath("arkts/type_check")],
    ])
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.node.name === NativeModule.Generated.name)
            return getGeneratedFilePath(`arkts/${NativeModule.Generated.name}`)
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
            case LayoutNodeRole.SERIALIZER:
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
            case LayoutNodeRole.SERIALIZER:
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
                        return this.getPath(`${this.prefix}${toFileName(node.name)}`)
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

export class KotlinLayout extends CommonLayoutBase {
    protected KotlinInternalPaths = new Map<string, string>([
        ["TypeChecker", "#components"],
        ["Serializer", "Serializer"],
        ["Deserializer", "Deserializer"],
        ["CallbackKind", "CallbackKind"],
        ["deserializeAndCallCallback", "CallbackDeserializeCall"],
        ["checkArkoalaCallbacks", "./CallbacksChecker"],
        ["CallbackTransformer", "./CallbackTransformer"],
    ])
    resolve(target: idl.LayoutTargetDescription): string {
        if (this.KotlinInternalPaths.has(target.node.name))
            return this.KotlinInternalPaths.get(target.node.name)!
        if (idl.isHandwritten(target.node) || peerGeneratorConfiguration().isHandWritten(target.node.name)) {
            return HandwrittenModule(this.library.language)
        }
        if (idl.isSyntheticEntry(target.node)) {
            return SyntheticModule
        }
        if (idl.isTypedef(target.node)) {
            return SyntheticModule
        }
        if (idl.isInterface(target.node) && !isComponentDeclaration(this.library, target.node)) {
            if (idl.isBuilderClass(target.node)) {
                return `${this.prefix}${toFileName(target.node.name)}Builder`
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

////////////////////////////////////////////////////////

export function arkoalaLayout(library: PeerLibrary, prefix: string = '', packagePath: string = ''): LayoutManagerStrategy {
    switch(library.language) {
        case idl.Language.TS: return new TsLayout(library, prefix)
        case idl.Language.ARKTS: return new ArkTsLayout(library, prefix)
        case idl.Language.JAVA: return new JavaLayout(library, prefix, packagePath)
        case idl.Language.CJ: return new CJLayout(library, prefix)
        case idl.Language.KOTLIN: return new KotlinLayout(library, prefix)
    }
    throw new Error(`Unimplemented language "${library.language}"`)
}
