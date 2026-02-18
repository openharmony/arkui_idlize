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
import { Language, LayoutManagerStrategy, LayoutNodeRole, PeerLibrary } from '@idlizer/core'
import * as idl from '@idlizer/core'
import { isComponentDeclaration, NativeModule, peerGeneratorConfiguration } from '@idlizer/libohos'

const BASE_PATH = 'framework'
const getGeneratedFilePath = (p:string) => path.join(BASE_PATH, p)

export const SyntheticModule = "./SyntheticDeclarations"
export function HandwrittenModule(language: Language, isSdk = false) {
    // does this switch needed here?
    switch (language) {
        case Language.TS: return "./handwritten"
        case Language.ARKTS: return isSdk ? './index' : "#handwritten"
        case Language.KOTLIN: return "./handwritten"
        default: throw new Error("Not implemented")
    }
}

function modifierNameGenerator(name: string): string {
    return name.replaceAll("Attribute", "" ).concat("Modifier")
}

function toFileName(name:string) {
    return name.split(/[_-]/gi).map(it => idl.capitalize(it)).join('')
}

function customPathSuggestion(pkg: string): string | undefined {
    const suggestions = peerGeneratorConfiguration().currentModulePackagesPaths
    if (!suggestions)
        return undefined
    const candidates = suggestions.filter(it => pkg.startsWith(it.package))
    for (const candidate of candidates) {
        if (pkg === candidate.package)
            return candidate.path
        if (pkg.startsWith(candidate.package))
            return path.join(candidate.path, pkg.substring(candidate.package.length + 1))
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

function getModuleImport(node: idl.IDLEntry, role: LayoutNodeRole, lang: Language): string | undefined {
    if (role == LayoutNodeRole.GLOBAL) return undefined
    if (idl.isInCurrentModule(node)) return undefined
    if (idl.isInExternalModule(node)) {
        if (role == LayoutNodeRole.SERIALIZER) return undefined
    }
    const conf = peerGeneratorConfiguration()
    // TBD: use idl.mapLibraryName(...) when the Arkoala imports printing is fixed
    // in ImportsCollector.printToLines(...)
    // return idl.mapLibraryName(node, lang, conf?.libraryNameMapping)

    const packageName = idl.getPackageName(node)
    const module = idl.getModuleFor(node)
    if (module.tsLikePackage !== undefined) {
        return `^` + module.tsLikePackage
    }
    let renamedPackageName = conf.libraryNameMapping?.get(packageName)?.get(lang.name)
    // Use '^' prefix as a workaround to distinguish outer module name from the current
    // in the ImportsCollector.printToLines(...)
    if (renamedPackageName) return `^${renamedPackageName}`
    return `@${packageName}`
}

export class TsLayout extends CommonLayoutBase {
    private tsInternalPaths = new Map<string, string>([
        ["SerializerBase", "@koalaui/interop"],
        ["DeserializerBase", "@koalaui/interop"],
        ["resourceFinalizerRegister", "@koalaui/interop"],
        ["CallbackKind", getGeneratedFilePath("peers/CallbackKind")],
        ["deserializeAndCallCallback", getGeneratedFilePath("peers/CallbackDeserializeCall")],
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

        const moduleImport = getModuleImport(target.node, target.role, Language.TS)
        if (moduleImport) return moduleImport

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

export class ArkTsLayout extends CommonLayoutBase {
    protected arkTSInternalPaths = new Map<string, string>([
        ["SerializerBase", "@koalaui/interop"],
        ["DeserializerBase", "@koalaui/interop"],
        ["resourceFinalizerRegister", "@koalaui/interop"],
        ["CallbackKind", getGeneratedFilePath("peers/CallbackKind")],
        ["deserializeAndCallCallback", getGeneratedFilePath("peers/CallbackDeserializeCall")],
        ["checkArkoalaCallbacks", "./CallbacksChecker"],
        ["CallbackTransformer", "./CallbackTransformer"],
    ])

    constructor(
        library: PeerLibrary,
        prefix?: string,
        private isSdk = false
    ) {
        super(library, prefix)
    }

    handwrittenPackage(): string {
        return HandwrittenModule(Language.ARKTS, this.isSdk)
    }

    // replace point symbol inside names, but not when it is a part of path
    readonly replacePattern = /(\.)[^\.\/]/g
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.hint === 'component.handwritten') {
            return 'handwritten/modifiers/hooks'
        }
        if (target.hint === 'component.modifier') {
            return modifierNameGenerator(target.node.name)
        }
        if (target.node.name === NativeModule.Generated.name)
            return `#components`
        if (this.arkTSInternalPaths.has(target.node.name))
            return this.arkTSInternalPaths.get(target.node.name)!

        if (idl.isHandwritten(target.node) || peerGeneratorConfiguration().isHandWritten(target.node.name)) {
            return HandwrittenModule(this.library.language, this.isSdk)
        }
        const packageName = idl.getPackageNameSafe(target.node)

        const moduleImport = getModuleImport(target.node, target.role, Language.ARKTS)
        if (moduleImport) return moduleImport

        let customPath: string | undefined
        if (packageName && idl.isInCurrentModule(target.node) && (customPath = customPathSuggestion(packageName))) {
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
    resolve(target: idl.LayoutTargetDescription): string {
        if (target.node.name === NativeModule.Generated.name)
            return getGeneratedFilePath(`arkts/${NativeModule.Generated.name}`)
        return super.resolve(target)
    }
}

export class CJLayout extends CommonLayoutBase {
    protected CJInternalPaths = new Map<string, string>([
        ["Serializer", "Serializer"],
        ["Deserializer", "Deserializer"],
        ["CallbackKind", "CallbackKind"],
        ["deserializeAndCallCallback", "CallbackDeserializeCall"],
        ["checkArkoalaCallbacks", "./CallbacksChecker"],
        ["CallbackTransformer", "./CallbackTransformer"],
    ])
    resolve(target: idl.LayoutTargetDescription): string {
        if (this.CJInternalPaths.has(target.node.name))
            return this.CJInternalPaths.get(target.node.name)!
        if (idl.isHandwritten(target.node) || peerGeneratorConfiguration().isHandWritten(target.node.name)) {
            return HandwrittenModule(this.library.language)
        }
        if (idl.isSyntheticEntry(target.node)) {
            return idl.getSyntheticTypesFileName()
        }
        if (idl.isTypedef(target.node)) {
            return SyntheticModule
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

export class KotlinLayout extends CommonLayoutBase {
    protected KotlinInternalPaths = new Map<string, string>([
        ["SerializerBase", "koalaui.interop"],
        ["DeserializerBase", "koalaui.interop"],
        ["resourceFinalizerRegister", "koalaui.interop"],
    ])
    resolve(target: idl.LayoutTargetDescription): string {
        if (this.KotlinInternalPaths.has(target.node.name))
            return this.KotlinInternalPaths.get(target.node.name)!
        return "koalaui.arkoala"
    }
}

////////////////////////////////////////////////////////

export function arkoalaLayout(library: PeerLibrary, prefix: string = ''): LayoutManagerStrategy {
    switch(library.language) {
        case idl.Language.TS: return new TsLayout(library, prefix)
        case idl.Language.ARKTS: return new ArkTsLayout(library, prefix)
        case idl.Language.CJ: return new CJLayout(library, prefix)
        case idl.Language.KOTLIN: return new KotlinLayout(library, prefix)
    }
    throw new Error(`Unimplemented language "${library.language}"`)
}
