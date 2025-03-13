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
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { NativeModule } from '../NativeModule';
import { PrinterClass, PrinterResult } from '../LayoutManager';

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
        return field.field.type
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
        
        const interfaces: string[] = (clazz.isStaticMaterialized || printer.language == Language.CJ) ? [] : ["MaterializedBase"]
        if (clazz.interfaces) {
            interfaces.push(
                ...clazz.interfaces.map(it => {
                    const typeArgs = it.typeArguments?.length ? `<${it.typeArguments.map(arg => printer.getNodeName(arg))}>` : ""
                    return `${this.namespacePrefix}${it.name}${typeArgs}`
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
        nsPath.forEach(it => printer.pushNamespace(it.name))
        if (clazz.isInterface) {
            if (printer.language == Language.CJ || printer.language == Language.JAVA) {
                printer.writeInterface(clazz.className, () => { })
            } else if (this.library.name === 'arkoala') {
                writeInterface(clazz.decl, printer)
            }
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
                writer.writeGetterImplementation(
                    new Method(
                        mField.name,
                        new MethodSignature(this.convertToPropertyType(field), []),
                        isStatic ? [MethodModifier.STATIC] : []
                    ), writer => {
                        writer.writeStatement(
                            isSimpleType
                                ? writer.makeReturn(writer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, []))
                                : writer.makeThrowError("Not implemented")
                        )
                    }
                );

                const isReadOnly = mField.modifiers.includes(FieldModifier.READONLY)
                if (!isReadOnly) {
                    const setSignature = new NamedMethodSignature(IDLVoidType,
                        [this.convertToPropertyType(field)], [mField.name])
                    writer.writeSetterImplementation(
                        new Method(
                            mField.name,
                            setSignature,
                            isStatic ? [MethodModifier.STATIC] : []
                        ), writer => {
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
                    );
                }
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
                                    ctorSig.args.map((it, index) => writer.makeUnwrapOptional(writer.makeString(ctorSig.argsNames[index])))),
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
                        const key = nsPath.map(it => it.name).concat([implementationClassName, 'constructor']).join('.')
                        injectPatch(writer, key, config.patchMaterialized)
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
        nsPath.forEach(() => printer.popNamespace())
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
        this.collector.addFeatures(['Serializer'], './peers/Serializer')
        this.collector.addFeatures(['CallbackKind'], './peers/CallbackKind')
        this.collector.addFeatures(['int32', 'float32'], '@koalaui/common')
        this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        if (this.library.language === Language.ARKTS) {
            this.collector.addFeatures(['Deserializer'], './peers/Deserializer')
        }
        if (this.library.language === Language.TS) {
            this.collector.addFeature('isInstanceOf', '@koalaui/interop')
            this.collector.addFeatures(['isResource', 'isPadding'], '../utils')
            this.collector.addFeatures(['Deserializer', 'createDeserializer'], './peers/Deserializer')
        }

        // specific runtime dependencies
        if (this.library.name === 'arkoala') {
            this.collector.addFeatures(['CallbackTransformer'], './peers/CallbackTransformer')
            if (this.library.language === Language.TS) {
                this.collector.addFeatures(['ArkUIGeneratedNativeModule'], './ArkUIGeneratedNativeModule')
            }
            if (this.library.language === Language.ARKTS) {
                this.collector.addFeatures(['ArkUIGeneratedNativeModule'], '#components')
            }
        } else {
            this.collector.addFeatures([NativeModule.Generated.name], `./${NativeModule.Generated.name}`)
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
    const className = clazz.getImplementationName()
    const clazzRefType = idl.createReferenceType(className,
        clazz.generics?.map(idl.createTypeParameterReference))
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
    private printPackage(): void {
        this.printer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    override printImports(): void {
        this.printPackage()
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
        imports.addFeature("TypeChecker", "#components")
    }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }
}

class CJMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

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

function writeInterface(decl: idl.IDLInterface, writer: LanguageWriter) {
    writer.writeInterface(decl.name, writer => {
        for (const p of decl.properties) {
            const modifiers: FieldModifier[] = []
            if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
            if (p.isStatic) modifiers.push(FieldModifier.STATIC)
            writer.writeFieldDeclaration(p.name, p.type, modifiers, p.isOptional)
        }
        for (const m of decl.methods) {
            if (m.isStatic) {
                continue
            }
            writer.writeMethodDeclaration(m.name,
                new NamedMethodSignature(
                    m.returnType,
                    m.parameters.map(it => it.type!),
                    m.parameters.map(it => it.name)));
        }
    })
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

function injectPatch(writer: LanguageWriter, key: string, patches: Map<string, Map<string, string>>) {
    if (patches.has(key)) {
        const record = patches.get(key)!
        if (record.has(writer.language.name)) {
            const text = record.get(writer.language.name)!
            text.split('\n').forEach(line => {
                writer.print(line)
            })
        }
    }
}