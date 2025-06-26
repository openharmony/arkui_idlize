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

import { IndentedPrinter, camelCaseToUpperSnakeCase, maybeOptional, Language, CppConvertor,
    createConstructPeerMethod, createDestroyPeerMethod, PeerClass, PeerMethod, PeerLibrary, CppReturnTypeConvertor,
    MaterializedClass,
    generatorHookName,
    IdlNameConvertor,
    isMaterialized,
    PrimitiveTypesInstance,
    isInterface,
    asPromise,
    generatorTypePrefix,
    isVMContextMethod,
} from '@idlizer/core'
import { getNodeTypes } from "../FileGenerators";
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { printMethodDeclaration } from "../LanguageWriters";
import { createGlobalScopeLegacy } from '../GlobalScopeUtils';
import { collectOrderedPeers } from '../PeersCollector';
import { getAccessorName, getDeclarationUniqueName } from './NativeUtils';
import { isComponentDeclaration } from '../ComponentsCollector';

export function generateEventReceiverName(componentName: string) {
    return `${peerGeneratorConfiguration().cppPrefix}ArkUI${componentName}EventsReceiver`
}

export function generateCapiParameters(library: PeerLibrary, method: PeerMethod, converter: IdlNameConvertor): string[] {
    const args = method.argAndOutConvertors(library).map(it => {
        let isPointer = it.isPointerType()
        return `${isPointer ? "const ": ""}${converter.convert(it.nativeType())}${isPointer ? "*": ""} ${it.param}`
    })
    if (method.sig.context && isInterface(method.sig.context)) {
        if (isComponentDeclaration(library, method.sig.context)) {
            args.unshift(`${PrimitiveTypesInstance.NativePointer.getText()} node`)
        } else if (isMaterialized(method.sig.context, library)) {
            const cppConvertor = library.createTypeNameConvertor(Language.CPP)
            args.unshift(`${cppConvertor.convert(method.sig.context)} peer`)
        }
    }
    if (!!asPromise(method.sig.returnType))
        args.unshift(`${generatorTypePrefix()}AsyncWorkerPtr asyncWorker`)
    if (isVMContextMethod(method.sig))
        args.unshift(`${generatorTypePrefix()}VMContext vmContext`)
    return args
}

export class HeaderVisitor {
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private modifiersList: IndentedPrinter,
        private accessorsList: IndentedPrinter,
        private eventsList: IndentedPrinter,
        private nodeTypesList: IndentedPrinter,
    ) {}
    private readonly returnTypeConvertor = new CppReturnTypeConvertor(this.library)

    private apiModifierHeader(clazz: PeerClass) {
        return `typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier {`
    }

    private printClassProlog(clazz: PeerClass) {
        this.api.print(this.apiModifierHeader(clazz))
        this.api.pushIndent()
        this.modifiersList.pushIndent()
        this.modifiersList.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier* (*get${clazz.componentName}Modifier)();`)
    }

    private printMethod(method: PeerMethod) {
        if (generatorHookName(method.originalParentName, method.method.name)) return
        const apiParameters = generateCapiParameters(this.library, method, this.library.createTypeNameConvertor(Language.CPP))
        printMethodDeclaration(this.api, this.returnTypeConvertor.convert(method.sig.returnType), `(*${method.sig.name})`, apiParameters, `;`)
    }

    private printClassEpilog(clazz: PeerClass) {
        this.api.popIndent()
        this.api.print(`} ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier;\n`)
        this.modifiersList.popIndent()
    }

    private printAccessors() {
        this.api.print("// Accessors\n")
        this.accessorsList.pushIndent()
        this.library.orderedMaterialized.forEach(c => {
            this.printAccessor(c)
            const accessorName = getAccessorName(c.decl)
            const className = getDeclarationUniqueName(c.decl)
            this.accessorsList.print(`const ${accessorName}* (*get${className}Accessor)();`)
        })
        const globals = createGlobalScopeLegacy(this.library)
        if (globals.methods.length) {
            this.printAccessor(globals)
            this.accessorsList.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${globals.className}Accessor* (*get${globals.className}Accessor)();`)
        }
        this.accessorsList.popIndent()
    }

    private printAccessor(clazz: MaterializedClass) {
        const accessorName = getAccessorName(clazz.decl)
        this.api.print(`typedef struct ${accessorName} {`)
        this.api.pushIndent()
        const mDestroyPeer = createDestroyPeerMethod(clazz)
        const methods = [mDestroyPeer, ...clazz.ctors, clazz.finalizer].concat(clazz.methods)
        methods.forEach(method => { if (method) this.printMethod(method) })
        this.api.popIndent()
        this.api.print(`} ${accessorName};\n`)
    }

    private printNodeTypes() {
        this.nodeTypesList.pushIndent()
        for (const nodeType of getNodeTypes(this.library)) {
            const name = `${peerGeneratorConfiguration().cppPrefix}ARKUI_${camelCaseToUpperSnakeCase(nodeType)}`
            this.nodeTypesList.print(name)
        }
        this.nodeTypesList.popIndent()
    }

    // TODO: have a proper Peer module visitor
    printApiAndDeserializer() {
        collectOrderedPeers(this.library).forEach(clazz => {
            this.printClassProlog(clazz)
            this.printMethod(createConstructPeerMethod(clazz))
            clazz.methods.forEach(method => {
                this.printMethod(method)
            })
            this.printClassEpilog(clazz)
        })
        this.printAccessors()
        this.printNodeTypes()
    }
}
