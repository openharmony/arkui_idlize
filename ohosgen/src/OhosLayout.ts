import * as idl from "@idlizer/core/idl"
import * as path from "path"
import { currentModule, getModuleFor, isExternalType, isInCurrentModule, isInIdlize, Language, LayoutManagerStrategy, LayoutNodeRole, LayoutTargetDescription, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration } from "@idlizer/libohos"
import { getExternalTypePackage } from "@idlizer/core"

function selectInternalsPath(): string {
    return currentModule().name + ".INTERNAL"
}
function selectInteropPath(): string {
    return "@koalaui/interop"
}
function canCropCurrentModulePrefix(): boolean {
    const module = currentModule()
    return module.packages.every(it => it.startsWith(module.name))
}
function cropCurrentModulePrefix(fqname: string): string {
    if (!canCropCurrentModulePrefix())
        throw new Error("Can not crop prefix for current module")
    const prefix = currentModule().name
    if (fqname == prefix)
        return fqname.split('.').at(-1)!
    return fqname.slice(prefix.length + 1)
}

// TBD: code duplication with the ArkoalaLayout
export function HandwrittenModule(language: Language): string {
    switch (language) {
        case Language.TS: return "../handwritten"
        case Language.ARKTS: return "../handwritten"
        default: throw new Error("Not implemented")
    }
}

export class OhosTsLayout implements LayoutManagerStrategy {
    constructor(
        protected library: PeerLibrary
    ) { }

    handwrittenPackage(): string {
        return "#handwritten"
    }

    protected readonly interopObjects = [
        'SerializerBase', 'DeserializerBase'
    ]

    protected selectInterface(node: idl.IDLEntry): string {
        const pack = getExternalTypePackage(node)
        if (pack) return pack
        if (isInIdlize(node)) {
            if (this.interopObjects.includes(node.name)) {
                return selectInteropPath()
            }
            return selectInternalsPath()
        }
        if (idl.isHandwritten(node)) {
            return HandwrittenModule(this.library.language)
        }
        if (isInCurrentModule(node)) {
            if (canCropCurrentModulePrefix()) {
                const cropped = cropCurrentModulePrefix(idl.getPackageName(node))
                return currentModule().useFoldersLayout
                    ? cropped.split('.').join("/") || 'synthetic'
                    : cropped
            }
            return currentModule().useFoldersLayout
                ? idl.getPackageClause(node).join("/") || 'synthetic'
                : "@" + idl.getPackageName(node)
        }
        return "@" + idl.getPackageName(node)
    }

    protected selectPeer(node:idl.IDLEntry): string {
        return this.selectInterface(node)
    }

    protected selectGlobal(node:idl.IDLEntry): string {
        if (idl.getPackageName(node) === '')
            return selectInternalsPath()
        return this.selectInterface(node)
    }

    protected selectSerializer(node:idl.IDLEntry): string {
        if (idl.isInterface(node) && isExternalType(node, this.library)) {
            return selectInternalsPath()
        }
        return this.selectInterface(node)
    }

    /////

    resolve({ role, node }: LayoutTargetDescription): string {
        switch (role) {
            case LayoutNodeRole.SERIALIZER: return this.selectSerializer(node)
            case LayoutNodeRole.INTERFACE: return this.selectInterface(node)
            case LayoutNodeRole.PEER: return this.selectPeer(node)
            case LayoutNodeRole.GLOBAL: return this.selectGlobal(node)
            case LayoutNodeRole.COMPONENT: return ''
        }
    }
}

// export class OhosCJLayout implements LayoutManagerStrategy {
//     constructor(private library: PeerLibrary) {}

//     private getPath(file:string):string {
//         return path.join('.', file)
//     }
//     resolve(node: idl.IDLNode, role: LayoutNodeRole): string {
//         switch (role) {
//             case LayoutNodeRole.INTERFACE: {
//                 if (idl.isEntry(node)) {
//                     const ns = idl.getNamespaceName(node)
//                     if (ns !== '') {
//                         return this.getPath(`${this.prefix}${ns.split('.').map(it => idl.capitalize(it)).join('')}Namespace`)
//                     }
//                 }
//                 if (idl.isInterface(node)) {
//                     if (isComponentDeclaration(this.library, node)) {
//                         return this.getPath(`${this.prefix}${toFileName(node.name)}`)
//                     }
//                     if (idl.isBuilderClass(node)) {
//                         return this.getPath(`${this.prefix}${toFileName(node.name)}Builder`)
//                     }
//                     if (isMaterialized(node, this.library)) {
//                         if (idl.isInterfaceSubkind(node)) {
//                             return this.getPath(toFileName(node.name) + 'Internal')
//                         }
//                         return this.getPath(toFileName(node.name))
//                     }
//                     return this.getPath(`${this.prefix}${toFileName(node.name)}Interfaces`)
//                 }
//                 return this.getPath(`Common`)
//             }
//             case LayoutNodeRole.PEER: {
//                 if (idl.isInterface(node)) {
//                     if (isComponentDeclaration(this.library, node)) {
//                         return this.getPath(`peers/${this.prefix}${toFileName(node.name)}Peer`)
//                     }
//                 }
//                 return this.getPath(`CommonPeer`)
//             }
//             case LayoutNodeRole.GLOBAL: {
//                 return 'GlobalScope'
//             }
//         }
//     }
// }

export function ohosLayout(library: PeerLibrary): LayoutManagerStrategy {
    switch(library.language) {
        case Language.TS:
        case Language.ARKTS:
        case Language.CJ:
            return new OhosTsLayout(library)
        //     return new CJLayout(library)
        default: throw new Error(`Ohos layout for language ${library.language.name} is not implemented`)
    }
}