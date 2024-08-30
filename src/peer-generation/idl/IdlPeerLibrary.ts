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

import * as idl from '../../idl';
import { BuilderClass } from '../BuilderClass';
import { MaterializedClass } from "../Materialized";
import { IdlComponentDeclaration, isBuilderClass, isConflictedDeclaration, isMaterialized } from './IdlPeerGeneratorVisitor';
import { IdlPeerClass } from "./IdlPeerClass";
import { IdlPeerFile } from "./IdlPeerFile";
import { TSTypeNameConvertor } from './IdlTypeNameConvertor';
import { isDefined, Language, throwException } from '../../util';
import { AggregateConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, CallbackFunctionConvertor, ClassConvertor, CustomTypeConvertor, EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, LengthConvertor, MapConvertor, MaterializedClassConvertor, NumberConvertor, OptionConvertor, PredefinedConvertor, StringConvertor, TupleConvertor, TypeAliasConvertor, UndefinedConvertor, UnionConvertor } from './IdlArgConvertors';

export type IdlPeerLibraryOutput = {
    outputC: string[]
}

export class IdlPeerLibrary {
    public readonly files: IdlPeerFile[] = []
    public readonly builderClasses: Map<string, BuilderClass> = new Map()
    public get buildersToGenerate(): BuilderClass[] {
        return Array.from(this.builderClasses.values()).filter(it => it.needBeGenerated)
    }

    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()
    public get materializedToGenerate(): MaterializedClass[] {
        return Array.from(this.materializedClasses.values()).filter(it => it.needBeGenerated)
    }

    constructor(
        public language: Language,
        public componentsToGenerate: Set<string>,
    ) {}

    readonly customComponentMethods: string[] = []
    // todo really dirty - we use it until we can generate interfaces
    // replacing import type nodes
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly componentsDeclarations: IdlComponentDeclaration[] = []
    readonly conflictedDeclarations: Set<idl.IDLEntry> = new Set()
    readonly nameConvertorInstance = new TSTypeNameConvertor(this)

    findPeerByComponentName(componentName: string): IdlPeerClass | undefined {
        for (const file of this.files)
            for (const peer of file.peers.values())
                if (peer.componentName == componentName) 
                    return peer
        return undefined
    }

    findFileByOriginalFilename(filename: string): IdlPeerFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    findComponentByDeclaration(iface: idl.IDLInterface): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration === iface || it.attributesDeclarations === iface)
    }

    findComponentByType(type: idl.IDLType): IdlComponentDeclaration | undefined {
        return this.componentsDeclarations.find(it =>
            it.interfaceDeclaration?.name === type.name || it.attributesDeclarations.name === type.name)
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        return this.findComponentByDeclaration(iface) !== undefined
    }

    shouldGenerateComponent(name: string): boolean {
        return !this.componentsToGenerate.size || this.componentsToGenerate.has(name)
    }

    mapType(type: idl.IDLType | undefined): string {
        return this.nameConvertorInstance.convert(type ?? idl.createVoidType())
    }

    ///need EnumType?
    resolveTypeReference(type: idl.IDLEnumType | idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        entries ??= this.files.flatMap(it => it.entries)
        const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier);
        if (qualifier) {
            // This is a namespace or enum member. Try enum first
            const parent = this.resolveTypeReference(idl.createReferenceType(qualifier), entries)///oh oh, just entries.find?
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === type.name)
            // Else try namespaces
            return entries.find(it =>
                it.name === type.name && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }
        const result = entries.find(it =>
            it.name === type.name && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Namespace))
        return result ??
            entries
                .map(it => it.scope)
                .filter(isDefined)
                .flat()
                .find(it => it.name === type.name)
    }

    // TODO temporary, needed for unification with PeerLibrary
    setCurrentContext(context: string | undefined) {
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false, maybeCallback: boolean = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(this, param, type)
        }
        if (idl.isPrimitiveType(type)) {
            switch (type.name) {
                case "any": return new CustomTypeConvertor(param, "Any")
                case "null_":
                case "undefined":
                case "void_": return new UndefinedConvertor(param)
                case "number": return new NumberConvertor(param)
                case "DOMString": return new StringConvertor(param)
                case "boolean": return new BooleanConvertor(param)
            }
        }
        if (idl.isReferenceType(type)) {
            if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.Import)) {
                switch (type.name) {
                    case "Callback": return new FunctionConvertor(this, param, type)
                    case "Resource": return new InterfaceConvertor("Resource", param, ResourceDeclaration)
                }
                return new ImportTypeConvertor(param, type)
            }
            switch (type.name) {
                case "unknown": return new CustomTypeConvertor(param, "Any")///should unknown be primitive type?
                case "object": return new CustomTypeConvertor(param, "Object")
            }
        }
        if (idl.isReferenceType(type) || idl.isEnumType(type)) {
            if (PredefinedTypes.has(type.name)) {
                return new CustomTypeConvertor(param, type.name, type.name)///predef conv?
            }
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl, maybeCallback)
        }
        if (idl.isUnionType(type)) {
            return new UnionConvertor(this, param, type)
        }
        if (idl.isContainerType(type)) {
            if (type.name === "sequence")
                return new ArrayConvertor(this, param, type, type.elementType[0])
            if (type.name === "record")
                return new MapConvertor(this, param, type, type.elementType[0], type.elementType[1])
        }
        if (idl.isTypeParameterType(type)) {
            // TODO: unlikely correct.
            return new CustomTypeConvertor(param, type.name)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${type.name} ${type.kind}`)
    }

    private declarationConvertor(param: string, type: idl.IDLType, declaration: idl.IDLEntry | undefined, maybeCallback: boolean): ArgConvertor {
        if (!declaration) {
            return this.customConvertor(type.name, param, type)
                ?? throwException(`Declaration not found for: ${type.name}`)
        }
        const declarationName = declaration.name!
        if (isConflictedDeclaration(declaration))
            return new CustomTypeConvertor(param, declarationName)
        let customConv = this.customConvertor(type.name, param, type)
        if (customConv) {
            return customConv
        }
        if (isImportDeclaration(declaration)) {
            switch (type.name) {
                case "Callback": return new FunctionConvertor(this, param, type)
                case "Resource": return new InterfaceConvertor("Resource", param, ResourceDeclaration)
            }
            return new ImportTypeConvertor(param, type as idl.IDLReferenceType)
        }
        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration, isStringEnum(declaration))
        }
        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, isStringEnum(declaration.parent))
        }
        if (idl.isCallback(declaration)) {
            return maybeCallback
                ? new CallbackFunctionConvertor(this, param, declaration)
                : new FunctionConvertor(this, param, declaration.returnType)
        }
        if (idl.isTypedef(declaration)) {
            return new TypeAliasConvertor(this, param, declaration)///, type.typeArguments)
        }
        if (idl.isInterface(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(this, declarationName, param, declaration)
            }
            return new InterfaceConvertor(declarationName, param, declaration)
        }
        if (idl.isClass(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(this, declarationName, param, declaration)
            }
            return new ClassConvertor(declarationName, param, declaration)
        }
        if (declaration.kind === idl.IDLKind.AnonymousInterface) {
            return new AggregateConvertor(this, param, type, declaration as idl.IDLInterface)
        }
        if (declaration.kind === idl.IDLKind.TupleInterface) {
            return new TupleConvertor(this, param, declaration as idl.IDLInterface)
        }
        // if (ts.isTypeParameterDeclaration(declaration)) {
        //     // TODO: incorrect, we must use actual, not formal type parameter.
        //     return new CustomTypeConvertor(param, identName(declaration.name)!)
        // }
        throw new Error(`Unknown decl ${declarationName} of kind ${declaration.kind}`)
    }

    private customConvertor(typeName: string, param: string, type: idl.IDLType): ArgConvertor | undefined {
        switch (typeName) {
            case `Dimension`:
            case `Length`:
                return new LengthConvertor(typeName, param)
            case `Date`:
                return new CustomTypeConvertor(param, typeName, typeName)
            case `AttributeModifier`:
                return new PredefinedConvertor(param, "AttributeModifier<any>", "AttributeModifier", "CustomObject")
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", "ContentModifier<any>")
            case `Record`:
                return new CustomTypeConvertor(param, "Record", "Record<string, string>")
            // case `Array`:
            //     return new ArrayConvertor(param, this, type, type.typeArguments![0])
            // case `Map`:
            //     return new MapConvertor(param, this, type, type.typeArguments![0], type.typeArguments![1])
            case `Callback`:
                return new FunctionConvertor(this, param, type)
            case `Optional`:
                const wrappedType = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!
                return new OptionConvertor(this, param, idl.toIDLType(wrappedType))
        }
        return undefined
    }
}

const PredefinedTypes = new Set([
    "ArrayBuffer", "Function", "Object"
])

export const ResourceDeclaration: idl.IDLInterface = {
    name: "Resource",
    kind: idl.IDLKind.Interface,
    inheritance: [],
    constructors: [],
    constants: [],
    properties: [
        {
            name: "id",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "type",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "moduleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "bundleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "params",
            kind: idl.IDLKind.Property,
            type: idl.createContainerType("sequence", [idl.createStringType()]),
            isReadonly: true,
            isStatic: false,
            isOptional: true,
        },
    ],
    methods: [],
    callables: [],
}

function isImportDeclaration(decl: idl.IDLEntry): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}

function isStringEnum(decl: idl.IDLEnum): boolean {
    return decl.elements.some(e => e.type.name === "DOMString")
}
