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

import * as idl from '@idlizer/core/idl'
import { capitalize, stringOrNone, Language, generifiedTypeName } from '@idlizer/core'
import { printPeerFinalizer, writePeerMethod } from "./PeersPrinter"
import {
    FieldModifier,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import {
    LanguageWriter, getInternalClassName,
    MaterializedClass, MaterializedField, PeerLibrary, LayoutNodeRole
} from "@idlizer/core"
import { groupOverloads, OverloadsPrinter } from "./OverloadsPrinter";
import { ImportsCollector } from "../ImportsCollector"
import { TargetFile } from "./TargetFile"
import {
    ARK_MATERIALIZEDBASE,
    ARK_MATERIALIZEDBASE_EMPTY_PARAMETER,
    ARKOALA_PACKAGE,
    ARK_OBJECTBASE,
} from "./lang/Java";
import { printJavaImports } from "./lang/JavaPrinters";
import { createReferenceType, forceAsNamedNode, IDLPointerType, IDLType, IDLVoidType, isOptionalType, maybeOptional } from '@idlizer/core/idl'
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { NativeModule } from '../NativeModule';
import { PrinterClass, PrinterResult } from '../LayoutManager';
import { injectPatch } from '../common';

interface MaterializedFileVisitor {
    visit(): PrinterResult
}

const FinalizableType = idl.maybeOptional(createReferenceType("Finalizable"), true)

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {

    protected readonly collector = new ImportsCollector()
    protected readonly printer = this.library.createLanguageWriter()
    protected readonly internalPrinter = this.library.createLanguageWriter(this.library.language)
    protected overloadsPrinter = new OverloadsPrinter(this.library, this.printer, this.library.language, false)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean
    ) { }

    abstract visit(): PrinterResult
    abstract printImports(): void

    convertToPropertyType(field: MaterializedField): IDLType {
        return idl.maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    protected get namespacePrefix(): string {
        return ""
    }

    protected printMaterializedClass(clazz: MaterializedClass) {
        const config = peerGeneratorConfiguration()
        const printer = this.printer

        this.printImports()

        const emptyParameterType = createReferenceType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = FinalizableType
        let superClassName = generifiedTypeName(clazz.superClass, getSuperName(clazz))
        if (!superClassName && printer.language == Language.JAVA) {
            superClassName = clazz.isStaticMaterialized ? ARK_OBJECTBASE : ARK_MATERIALIZEDBASE
        }
        const interfaces: string[] = clazz.isStaticMaterialized ? [] : ["MaterializedBase"]
        if (clazz.interfaces) {
            interfaces.push(
                ...clazz.interfaces.map(it => {
                    const typeArgs = it.typeArguments?.length ? `<${it.typeArguments.map(arg => printer.getNodeName(arg))}>` : ""
                    return `${this.namespacePrefix}${it.name}${printer.language == Language.CJ ? 'Interface' : ''}${typeArgs}`
                }))
        }

        // TODO: workarond for ContentModifier<T> which returns WrappedBuilder<[T]>
        //       and the WrappedBuilder is defined as "class WrappedBuilder<Args extends Object[]>""
        let classTypeParameters = clazz.generics
        const hasMethodWithTypeParams = clazz.methods.find(it =>
            it.method.signature.args.find(it => idl.isTypeParameterType(it)) !== undefined
        )
        // Need to restrict generic type to the Object type
        if (hasMethodWithTypeParams) {
            classTypeParameters = ["T extends Object"]
        }

        if (clazz.isInterface) {
            const genericsClause = clazz.generics?.length ? `<${clazz.generics.join(", ")}>` : ''
            interfaces.push(`${this.namespacePrefix}${this.clazz.className}${genericsClause}`)
        }

        const nsPath = idl.getNamespacesPathFor(clazz.decl)
        if (clazz.isInterface) {
            writeInterface(clazz, printer)
        } else if (!clazz.isStaticMaterialized) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(
                getInternalClassName(clazz.className),
                writer => writeFromPtrMethod(clazz, writer, classTypeParameters),
                undefined,
                undefined,
                undefined,
                undefined,
                false
            )
        }

        const implementationClassName = clazz.getImplementationName()
        printer.writeClass(implementationClassName, writer => {
            if (!superClassName && !clazz.isStaticMaterialized) {
                writer.writeFieldDeclaration("peer", FinalizableType, undefined, true, writer.makeNull())
                // write getPeer() method
                const getPeerSig = new MethodSignature(idl.createOptionalType(idl.createReferenceType("Finalizable")), [])
                writer.writeMethodImplementation(new Method("getPeer", getPeerSig, [MethodModifier.PUBLIC]), writer => {
                    writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
                })
            }
            // getters and setters for fields
            clazz.fields.forEach(field => {

                const mField = field.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !field.argConvertor.useArray // type needs to be deserialized from the native
                const isStatic = mField.modifiers.includes(FieldModifier.STATIC)
                const receiver = isStatic ? implementationClassName : 'this'
                const isReadOnly = mField.modifiers.includes(FieldModifier.READONLY)
                writer.writeProperty(mField.name, this.convertToPropertyType(field), mField.modifiers,
                    {
                        method: new Method('get', new MethodSignature(this.convertToPropertyType(field), [])), op: () => {
                            writer.writeStatement(
                            isSimpleType
                                ? writer.makeReturn(writer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, []))
                                : writer.makeThrowError("Not implemented")
                            )
                        }
                    },
                    {
                        method: new Method('set', new NamedMethodSignature(idl.IDLVoidType, [mField.type], [mField.name])), op: () => {
                            let castedNonNullArg
                            if (field.isNullableOriginalTypeField) {
                                castedNonNullArg = `${mField.name}_NonNull`
                                this.printer.writeStatement(writer.makeAssign(castedNonNullArg,
                                    undefined,
                                    writer.makeCast(writer.makeString(mField.name), mField.type),
                                    true))
                            } else {
                                castedNonNullArg = mField.name
                            }
                            writer.writeMethodCall(receiver, `set${capitalize(mField.name)}`, [castedNonNullArg])
                        }
                    }
                )
            })

            const ctorPostfix = `_${clazz.className.toLowerCase()}`
            if (clazz.ctor) {
                const pointerType = IDLPointerType
                // makePrivate(clazz.ctor.method)
                this.library.setCurrentContext(`${clazz.className}.constructor`)
                writePeerMethod(this.library, writer, clazz.ctor, true, this.dumpSerialized, ctorPostfix, "", pointerType)
                this.library.setCurrentContext(undefined)

                const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
                const sigWithPointer = new NamedMethodSignature(
                    ctorSig.returnType,
                    ctorSig.args.map(it => idl.createOptionalType(it)),
                    ctorSig.argsNames,
                    ctorSig.defaults)

                if (writer.language != Language.JAVA) {
                    writer.writeConstructorImplementation(implementationClassName, sigWithPointer, writer => {
                        if (superClassName) {
                            let params: string[] = []
                            // workaround for MutableStyledString which does not have a constructor
                            // the same as in the parent StyledString class
                            if (superClassName === "StyledString") params = [""]
                            writer.writeSuperCall(params);
                        }

                        const key = nsPath.map(it => it.name).concat([implementationClassName, 'constructor']).join('.')
                        injectPatch(writer, key, config.patchMaterialized)

                        const allOptional = ctorSig.args.every(it => isOptionalType(it))
                        const hasStaticMethods = clazz.methods.some(it => it.method.modifiers?.includes(MethodModifier.STATIC))
                        if (hasStaticMethods && allOptional) {
                            if (ctorSig.args.length == 0) {
                                writer.print(`// Constructor does not have parameters.`)
                            } else {
                                writer.print(`// All constructor parameters are optional.`)
                            }
                            writer.print(`// It means that the static method call invokes ctor method as well`)
                            writer.print(`// when all arguments are undefined.`)
                        }
                        let ctorStatements: LanguageStatement = writer.makeBlock([
                            writer.makeAssign("ctorPtr", IDLPointerType,
                                writer.makeMethodCall(implementationClassName, `ctor${ctorPostfix}`,
                                    ctorSig.args.map((it, index) => {
                                        const arg = writer.makeString(ctorSig.argsNames[index])
                                        if (idl.isOptionalType(it))
                                            return arg
                                        return writer.makeUnwrapOptional(arg)
                                    })),
                                true),
                            writer.makeAssign(
                                "this.peer",
                                FinalizableType,
                                writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${implementationClassName}.getFinalizer()`)]),
                                false
                            )
                        ], false)
                        if (!allOptional) {
                            ctorStatements =
                                writer.makeCondition(
                                    ctorSig.args.length === 0 ? writer.makeString("true") :
                                        writer.makeNaryOp('||', ctorSig.argsNames.map(it =>
                                            writer.language == Language.CJ ?
                                                writer.makeDefinedCheck(it) :
                                                writer.language == Language.JAVA ?
                                                    writer.makeNaryOp('!=', [writer.makeString(it), writer.makeUndefined()]) :
                                                    writer.makeNaryOp('!==', [writer.makeString(it), writer.makeUndefined()]))
                                        ),
                                    writer.makeBlock([ctorStatements,])
                                )
                        }
                        writer.writeStatement(ctorStatements)
                    })
                } else {
                    // constructor with a special parameter to use in static methods
                    const emptySignature = new MethodSignature(IDLVoidType, [emptyParameterType])
                    writer.writeConstructorImplementation(implementationClassName, emptySignature, writer => {
                        writer.writeSuperCall([emptySignature.argName(0)]);
                    })

                    const ctorSig = clazz.ctor.method.signature as NamedMethodSignature

                    // generate a constructor with zero parameters for static methods
                    // in case there is no alredy defined one
                    if (ctorSig.args.length > 0) {
                        writer.writeConstructorImplementation(implementationClassName, new MethodSignature(IDLVoidType, []), writer => {
                            writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
                        })
                    }

                    writer.writeConstructorImplementation(implementationClassName, ctorSig, writer => {
                        writer.writeSuperCall([`(${forceAsNamedNode(emptyParameterType).name})null`]);

                        const args = ctorSig.argsNames.map(it => writer.makeString(it))
                        writer.writeStatement(
                            writer.makeAssign('ctorPtr', IDLPointerType,
                                writer.makeMethodCall(implementationClassName, `ctor${ctorPostfix}`, args),
                                true))

                        writer.writeStatement(writer.makeAssign(
                            'this.peer',
                            finalizableType,
                            writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${implementationClassName}.getFinalizer()`)]),
                            false
                        ))
                    })
                }
            }
            if (clazz.finalizer) printPeerFinalizer(clazz, writer)

            for (const grouped of groupOverloads(clazz.methods)) {
                this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
            }

            // TBD: Refactor tagged methods staff
            const seenTaggedMethods = new Set<string>()
            clazz.taggedMethods
                .map(it => methodFromTagged(it))
                .filter(it => {
                    if (seenTaggedMethods.has(it.name)) return false
                    seenTaggedMethods.add(it.name)
                    return true
                })
                .forEach(method => {
                    // const method = methodFromTagged(taggedMethod)
                    const signature = new NamedMethodSignature(
                        method.returnType,
                        method.parameters.map(it => it.type!),
                        method.parameters.map(it => it.name)
                    )
                    // TBD: Add tagged methods implementation
                    writer.writeMethodImplementation(new Method(getTaggedName(method)!, signature), writer => {
                        writer.writeStatement(
                            writer.makeThrowError("TBD")
                        )
                    })
                })

            clazz.methods.forEach(method => {
                const privateMethod = method.getPrivateMethod()
                const returnType = privateMethod.tsReturnType()
                this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.overloadedName}`)
                writePeerMethod(this.library, writer, privateMethod, true, this.dumpSerialized, "_serialize",
                    writer.language == Language.CJ ?
                        "if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception(\"\")}" :
                        writer.language == Language.JAVA ?
                            "this.peer.ptr" :
                            "this.peer!.ptr", returnType)
                this.library.setCurrentContext(undefined)
            })

            if (clazz.isInterface) {
                writeFromPtrMethod(clazz, writer, classTypeParameters)
            }

        }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)
    }
}

class TSMaterializedFileVisitor extends MaterializedFileVisitorBase {
    protected collectImports(imports: ImportsCollector) {
        const decl = this.clazz.decl
        collectDeclDependencies(this.library, decl, imports, {
            expandTypedefs: true,
            includeTransformedCallbacks: true,
            includeMaterializedInternals: true,
        })
    }

    override printImports() {
        // collect imports
        this.collectImports(this.collector)

        // common runtime dependencies
        this.collector.addFeatures([
            'Finalizable',
            'runtimeType',
            'RuntimeType',
            'SerializerBase',
            'registerCallback',
            'wrapCallback',
            'toPeerPtr',
            'KPointer',
        ], '@koalaui/interop')
        this.collector.addFeatures(['MaterializedBase'], '@koalaui/interop')
        this.collector.addFeatures(['unsafeCast'], '@koalaui/common')
        collectDeclItself(this.library, idl.createReferenceType("Serializer"), this.collector)
        collectDeclItself(this.library, idl.createReferenceType("CallbackKind"), this.collector)
        this.collector.addFeatures(['int32', 'int64', 'float32'], '@koalaui/common')
        this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        if (this.library.language === Language.ARKTS) {
            this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
            collectDeclItself(this.library, idl.createReferenceType("Deserializer"), this.collector)
        }
        if (this.library.language === Language.TS) {
            this.collector.addFeature('isInstanceOf', '@koalaui/interop')
            collectDeclItself(this.library, idl.createReferenceType("Deserializer"), this.collector)
        }

        // specific runtime dependencies
        collectDeclItself(this.library, idl.createReferenceType(NativeModule.Generated.name), this.collector)
        if (this.library.name === 'arkoala') {
            this.collector.addFeatures(['CallbackTransformer'], './peers/CallbackTransformer')
            if (this.library.language === Language.TS) {
                this.collector.addFeatures(['GestureName', 'GestureComponent'], './shared/generated-utils')
            }
        }
    }

    override get namespacePrefix(): string {
        const namespacePrefix = idl.getNamespaceName(this.clazz.decl)
        return namespacePrefix.length ? `${idl.getNamespaceName(this.clazz.decl)}.` : ""
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

function writeFromPtrMethod(clazz: MaterializedClass, writer: LanguageWriter, classTypeParameters?: string[]) {
    // write "fromPtr(ptr: number): MaterializedClass" method
    const className: string = clazz.getImplementationName()
    const clazzRefType = clazz.isInterface
        ? idl.createReferenceType(getInternalClassName(clazz.className), clazz.generics?.map(it => idl.createTypeParameterReference(it)))
        : idl.createReferenceType(clazz.decl, clazz.generics?.map(it => idl.createTypeParameterReference(it)))
    const fromPtrSig = new NamedMethodSignature(clazzRefType, [idl.IDLPointerType], ["ptr"])
    writer.writeMethodImplementation(new Method("fromPtr", fromPtrSig, [MethodModifier.PUBLIC, MethodModifier.STATIC], classTypeParameters), writer => {
        const objVar = `obj`
        writer.writeStatement(writer.makeAssign(objVar,
            clazzRefType,
            //TODO: Need to pass IDLType instead of string to makeNewObject
            writer.makeNewObject(writer.getNodeName(clazzRefType), writer.language == Language.JAVA ? [] : clazz.ctor!.method.signature.args.map(it => writer.makeNull(writer.getNodeName(it)))),
            true)
        )
        writer.writeStatement(
            writer.makeAssign(`${objVar}.peer`, idl.createReferenceType("Finalizable"),
                writer.makeNewObject('Finalizable', [writer.makeString('ptr'), writer.makeString(`${className}.getFinalizer()`)]), false),
        )
        writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
    })
}

class JavaMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void {
        const imports = [{ feature: 'org.koalaui.interop.Finalizable', module: '' }]
        printJavaImports(this.printer, imports)
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

class ArkTSMaterializedFileVisitor extends TSMaterializedFileVisitor {
    protected collectImports(imports: ImportsCollector): void {
        super.collectImports(imports)
        collectDeclItself(this.library, idl.createReferenceType("TypeChecker"), this.collector)
    }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }
}

class CJMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}


class MaterializedVisitor implements PrinterClass {
    readonly materialized: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    private printContent(clazz: MaterializedClass): PrinterResult {
        let visitor: MaterializedFileVisitor
        if (Language.TS == this.library.language) {
            visitor = new TSMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (Language.ARKTS == this.library.language) {
            visitor = new ArkTSMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (this.library.language == Language.JAVA) {
            visitor = new JavaMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (this.library.language == Language.CJ) {
            visitor = new CJMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else {
            throw new Error(`Unsupported language ${this.library.language} in MaterializedPrinter.ts`)
        }

        return visitor.visit()
    }

    print(): PrinterResult[] {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        return this.library.materializedToGenerate.flatMap(it => {
            return this.printContent(it)
        })
    }
}

export function createMaterializedPrinter(dumpSerialized: boolean) {
    return (peerLibrary: PeerLibrary) => printMaterialized(peerLibrary, dumpSerialized).print()
}

export function printMaterialized(peerLibrary: PeerLibrary, dumpSerialized: boolean) {
    return new MaterializedVisitor(peerLibrary, dumpSerialized)
}

function getSuperName(clazz: MaterializedClass): string | undefined {
    const superClass = clazz.superClass
    if (!superClass) return undefined
    return clazz.isInterface ? getInternalClassName(superClass.name) : superClass.name
}

function writeInterface(clazz: MaterializedClass, writer: LanguageWriter) {
    const decl: idl.IDLInterface = clazz.decl
    const superInterface = writer.language == Language.JAVA ? ["Ark_Object"] : undefined
    writer.writeInterface(decl.name, writer => {
        for (const p of decl.properties) {
            const modifiers: FieldModifier[] = []
            if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
            if (p.isStatic) modifiers.push(FieldModifier.STATIC)
            writer.writeProperty(p.name, writer.language == Language.JAVA ? p.type : maybeOptional(p.type, p.isOptional), modifiers)
        }
        for (const m of decl.methods) {
            writer.writeMethodDeclaration(m.name,
                new NamedMethodSignature(
                    m.returnType,
                    m.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
                    m.parameters.map(it => it.name)));
        }
    }, superInterface, clazz.generics)
}

// TBD: Refactor tagged method staff
function getTaggedName(node: idl.IDLEntry): stringOrNone {
    return idl.getExtAttribute(node, idl.IDLExtendedAttributes.DtsName) ?? node.name
}

function paramFromTagged(paramOrTag: idl.IDLParameter | idl.SignatureTag): idl.IDLParameter {
    const param = paramOrTag as idl.IDLParameter
    if (param.kind === idl.IDLKind.Parameter) return param
    const tag = paramOrTag as idl.SignatureTag
    return idl.createParameter(tag.name, idl.IDLStringType)
}

function paramsFromTagged(node: idl.IDLSignature): idl.IDLParameter[] {
    let mix: (idl.IDLParameter | idl.SignatureTag)[] = node.parameters.slice(0)
    for (const tag of idl.fetchSignatureTags(node))
        mix.splice(tag.index, 0, tag)

    return mix.map(it => paramFromTagged(it))
}

function methodFromTagged(method: idl.IDLMethod): idl.IDLMethod {
    return idl.createMethod(
        getTaggedName(method)!,
        paramsFromTagged(method),
        method.returnType,
        {
            isStatic: method.isStatic,
            isOptional: method.isOptional,
            isAsync: method.isAsync,
            isFree: method.isFree,
        },
        {
            extendedAttributes: method.extendedAttributes,
            fileName: method.fileName,
            documentation: method.documentation,
        },
        method.typeParameters
    )
}
