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
import { capitalize, stringOrNone, Language, generifiedTypeName, sanitizeGenerics, ArgumentModifier, generatorConfiguration, getSuper, ReferenceResolver } from '@idlizer/core'
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
    protected overloadsPrinter = new OverloadsPrinter(this.library, this.printer, this.library.language, false, this.library.useMemoM3)

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

    printCtor(clazz: MaterializedClass, superClassName?: string) {
        const config = peerGeneratorConfiguration()

        const ctorPostfix = `_${clazz.className.toLowerCase()}`
        const implementationClassName = clazz.getImplementationName()
        const pointerType = IDLPointerType
        this.library.setCurrentContext(`${clazz.className}.constructor`)
        writePeerMethod(this.library, this.printer, clazz.ctor!, true, this.dumpSerialized, ctorPostfix, "", pointerType)
        this.library.setCurrentContext(undefined)

        const ctorSig = clazz.ctor!.method.signature as NamedMethodSignature
        const sigWithPointer = new NamedMethodSignature(
            ctorSig.returnType,
            ctorSig.args,
            ctorSig.argsNames,
            ctorSig.defaults,
            ctorSig.args.map(() => ArgumentModifier.OPTIONAL))
        const nsPath = idl.getNamespacesPathFor(clazz.decl)

        this.printer.writeConstructorImplementation(this.namespacePrefix.concat(implementationClassName), sigWithPointer, writer => {
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
                                    writer.makeNaryOp('!==', [writer.makeString(it), writer.makeUndefined()]))
                            ),
                        writer.makeBlock([ctorStatements,])
                    )
            }
            writer.writeStatement(ctorStatements)
        })
    }

    printOverloads(clazz: MaterializedClass) {
        for (const grouped of groupOverloads(clazz.methods)) {
            this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
        }
    }

    printTaggedMethods(clazz: MaterializedClass) {
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
                this.printer.writeMethodImplementation(new Method(getTaggedName(method)!, signature), writer => {
                    writer.writeStatement(
                        writer.makeThrowError("TBD")
                    )
                })
            })
    }

    printMethods(clazz: MaterializedClass) {
        clazz.methods.forEach(method => {
            const privateMethod = method.getPrivateMethod()
            const returnType = privateMethod.tsReturnType()
            this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.overloadedName}`)
            writePeerMethod(this.library, this.printer, privateMethod, true, this.dumpSerialized, "_serialize",
                this.printer.language == Language.CJ ?
                    "if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception(\"\")}" :
                    this.printer.language == Language.JAVA ?
                        "this.peer.ptr" :
                        "this.peer!.ptr", returnType)
            this.library.setCurrentContext(undefined)
        })
    }

    printFields(clazz: MaterializedClass) {
        const implementationClassName = clazz.getImplementationName()
        clazz.fields.forEach(field => {

            const mField = field.field

            // TBD: use deserializer to get complex type from native
            const isStatic = mField.modifiers.includes(FieldModifier.STATIC)
            const receiver = isStatic ? implementationClassName : 'this'
            this.printer.writeProperty(mField.name, this.convertToPropertyType(field), mField.modifiers,
                {
                    method: new Method('get', new MethodSignature(this.convertToPropertyType(field), [])), op: () => {
                        this.printer.writeStatement(
                            this.printer.makeReturn(this.printer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, []))
                        )
                    }
                },
                {
                    method: new Method('set', new NamedMethodSignature(idl.IDLVoidType, [mField.type], [mField.name])), op: () => {
                        let castedNonNullArg
                        if (field.isNullableOriginalTypeField) {
                            castedNonNullArg = `${mField.name}_NonNull`
                            this.printer.writeStatement(this.printer.makeAssign(castedNonNullArg,
                                undefined,
                                this.printer.makeCast(this.printer.makeString(mField.name), mField.type),
                                true))
                        } else {
                            castedNonNullArg = mField.name
                        }
                        this.printer.writeMethodCall(receiver, `set${capitalize(mField.name)}`, [castedNonNullArg])
                    }
                }
            )
        })
    }

    protected get namespacePrefix(): string {
        return ""
    }
    protected mangle(className: string): string {
        return className
    }

    protected printMaterializedClass(clazz: MaterializedClass) {
        const printer = this.printer

        this.printImports()

        let superClassName = generifiedTypeName(clazz.superClass, getSuperName(clazz, this.library))
        if (!superClassName && printer.language == Language.JAVA) {
            superClassName = clazz.isStaticMaterialized ? ARK_OBJECTBASE : ARK_MATERIALIZEDBASE
        }
        const interfaces: string[] = clazz.isStaticMaterialized ? [] : ["MaterializedBase"]
        if (clazz.interfaces) {
            interfaces.push(
                ...clazz.interfaces.map(it => {
                    const decl = this.library.resolveTypeReference(it)
                    if (!decl) {
                        throw new Error(`Not found declaration "${it.name}"`)
                    }
                    const typeArgs = it.typeArguments?.length ? `<${it.typeArguments.map(arg => printer.getNodeName(arg))}>` : ""
                    const nsName = printer.language === Language.CJ ? decl.name : idl.getQualifiedName(decl, 'namespace.name')
                    return `${this.namespacePrefix}${nsName}${printer.language == Language.CJ ? 'Interface' : ''}${typeArgs}`
                }))
        }

        const classTypeParameters = clazz.generics?.map(sanitizeGenerics)

        if (clazz.isInterface) {
            const genericsClause = clazz.generics?.length ? `<${clazz.generics.map(sanitizeGenerics).join(", ")}>` : ''
            const nsName = printer.language === Language.CJ ? clazz.className : idl.getQualifiedName(clazz.decl, "namespace.name")
            interfaces.push(`${this.namespacePrefix}${nsName}${genericsClause}`)
        }

        if (clazz.isInterface) {
            writeInterface(clazz, printer)
        } else if (!clazz.isStaticMaterialized) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(
                this.mangle(getInternalClassName(clazz.className)),
                (writer) => {
                    writer.makeStaticBlock(() => {
                        writeFromPtrMethod(clazz, writer, classTypeParameters)
                    })
                },
                undefined,
                undefined,
                undefined,
                undefined,
                false
            )
        }

        const implementationClassName = clazz.getImplementationName()

        if (printer.language !== Language.KOTLIN) {
            printer.writeClass(this.mangle(implementationClassName), writer => {
                if (!superClassName && !clazz.isStaticMaterialized) {
                    writer.writeFieldDeclaration("peer", FinalizableType, undefined, true, writer.makeNull())
                    // write getPeer() method
                    const getPeerSig = new MethodSignature(idl.createOptionalType(idl.createReferenceType("Finalizable")), [])
                    writer.writeMethodImplementation(new Method("getPeer", getPeerSig, [MethodModifier.PUBLIC]), writer => {
                        writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
                    })
                }

                this.printFields(clazz)

                if (clazz.ctor) {
                    this.printCtor(clazz, superClassName)
                }
                if (clazz.finalizer) printPeerFinalizer(clazz, writer)

                this.printOverloads(clazz)
                this.printTaggedMethods(clazz)
                this.printMethods(clazz)

                if (clazz.isInterface) {
                    writeFromPtrMethod(clazz, writer, classTypeParameters)
                }

            }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)
    
        }
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
        this.clazz.fields.forEach(field => {
            if (idl.isReferenceType(field.field.type)) {
                collectDeclItself(this.library, field.field.type, imports, {
                    includeMaterializedInternals: true,
                    includeTransformedCallbacks: true
                })
            }
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

        const hookMethods = generatorConfiguration().hooks.get(this.clazz.className)
        const handwrittenPackage = this.library.layout.handwrittenPackage()
        if (hookMethods) {
            for (const [methodName, hook] of hookMethods.entries()) {
                const hookName = hook ? hook.hookName : `hook${this.clazz.className}${capitalize(methodName)}`
                this.collector.addFeature(hookName, handwrittenPackage)
            }
        }
        if (generatorConfiguration().externalTypes.size > 0
            || generatorConfiguration().externalPackages.length > 0) {
            this.collector.addFeature("extractors", handwrittenPackage)
        }
        // specific runtime dependencies
        collectDeclItself(this.library, idl.createReferenceType(NativeModule.Generated.name), this.collector)
        if (this.library.name === 'arkoala') {
            this.collector.addFeatures(['CallbackTransformer'], '../CallbackTransformer')
            if (this.library.language === Language.TS) {
                this.collector.addFeatures(['GestureName', 'GestureComponent'], './shared/generated-utils')
            }
        }
    }

    private calcClassWeight() {
        // correct order to fix rollup
        if (!this.clazz.superClass) {
            return 0
        }
        let superClass = this.library.resolveTypeReference(this.clazz.superClass)
        let weight = 0
        while (superClass) {
            weight++
            superClass = idl.isInterface(superClass) ? getSuper(superClass, this.library) : undefined
        }
        return weight
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE,
            },
            weight: this.calcClassWeight()
        }
    }
}

function writeFromPtrMethod(clazz: MaterializedClass, writer: LanguageWriter, classTypeParameters?: string[]) {
    // write "fromPtr(ptr: number): MaterializedClass" method
    const classNamespace = writer.language == Language.CJ ? idl.getNamespaceName(clazz.decl) : ""
    const className: string = `${classNamespace}${clazz.getImplementationName()}`
    const clazzRefType = clazz.isInterface
        ? idl.createReferenceType(classNamespace.concat(getInternalClassName(clazz.className)), clazz.generics?.map(it => idl.createTypeParameterReference(sanitizeGenerics(it))))
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

    override printCtor(clazz: MaterializedClass, superClassName?: string): void {
        const emptyParameterType = createReferenceType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const ctorPostfix = `_${clazz.className.toLowerCase()}`
        const implementationClassName = clazz.getImplementationName()
        const pointerType = IDLPointerType
        this.library.setCurrentContext(`${clazz.className}.constructor`)
        writePeerMethod(this.library, this.printer, clazz.ctor!, true, this.dumpSerialized, ctorPostfix, "", pointerType)
        this.library.setCurrentContext(undefined)

        const ctorSig = clazz.ctor!.method.signature as NamedMethodSignature
        // constructor with a special parameter to use in static methods
        const emptySignature = new MethodSignature(IDLVoidType, [emptyParameterType])
        this.printer.writeConstructorImplementation(implementationClassName, emptySignature, writer => {
            writer.writeSuperCall([emptySignature.argName(0)]);
        })

        // generate a constructor with zero parameters for static methods
        // in case there is no alredy defined one
        if (ctorSig.args.length > 0) {
            this.printer.writeConstructorImplementation(implementationClassName, new MethodSignature(IDLVoidType, []), writer => {
                writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
            })
        }

        this.printer.writeConstructorImplementation(implementationClassName, ctorSig, writer => {
            writer.writeSuperCall([`(${forceAsNamedNode(emptyParameterType).name})null`]);

            const args = ctorSig.argsNames.map(it => writer.makeString(it))
            writer.writeStatement(
                writer.makeAssign('ctorPtr', IDLPointerType,
                    writer.makeMethodCall(implementationClassName, `ctor${ctorPostfix}`, args),
                    true))

            writer.writeStatement(writer.makeAssign(
                'this.peer',
                FinalizableType,
                writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${implementationClassName}.getFinalizer()`)]),
                false
            ))
        })
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

    override printOverloads(clazz: MaterializedClass) {
        for (let method of clazz.methods) {
            if (!method.method.modifiers?.includes(MethodModifier.PRIVATE))
                method.method.modifiers!.push(MethodModifier.PUBLIC)
            this.printer.writeMethodImplementation(method.method, (writer) => {
                this.overloadsPrinter.printPeerCallAndReturn(clazz, method.method, method)
            })
        }
    }

    override mangle(className: string): string {
        return this.namespacePrefix.concat(className)
    }
    override get namespacePrefix(): string {
        return idl.getNamespaceName(this.clazz.decl)
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

class KotlinMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    override printOverloads(clazz: MaterializedClass) {
        for (let method of clazz.methods) {
            if (!method.method.modifiers?.includes(MethodModifier.PRIVATE))
                method.method.modifiers!.push(MethodModifier.PUBLIC)
            this.printer.writeMethodImplementation(method.method, (writer) => {
                this.overloadsPrinter.printPeerCallAndReturn(clazz, method.method, method)
            })
        }
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
        } else if (this.library.language == Language.KOTLIN) {
            visitor = new KotlinMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else {
            throw new Error(`Unsupported language ${this.library.language} in MaterializedPrinter.ts`)
        }

        return visitor.visit()
    }

    print(): PrinterResult[] {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        const materializedClasses = this.library.orderedMaterialized
        const isParent = (maybeParent: MaterializedClass, maybeDescendant: MaterializedClass): boolean => {
            if (!maybeDescendant.superClass) return false
            const nearestParent = this.library.resolveTypeReference(maybeDescendant.superClass)
            if (!nearestParent) return false
            const nearestParentFQN = idl.getFQName(nearestParent)
            const nearestMaterializedParent = materializedClasses.find(it => idl.getFQName(it.decl) === nearestParentFQN)
            if (nearestMaterializedParent === maybeParent)
                return true
            return nearestMaterializedParent
                ? isParent(maybeParent, nearestMaterializedParent)
                : false
        }
        const sortedMaterializedClasses = Array.from(materializedClasses).sort((a, b) => {
            if (isParent(a, b)) return -1
            if (isParent(b, a)) return 1
            return 0
        })
        return sortedMaterializedClasses.flatMap(it => {
            return this.printContent(it)
        })
    }
}

export function createMaterializedPrinter(dumpSerialized: boolean) {
    return (peerLibrary: PeerLibrary) => LanguageWriter.relativeReferences(true, () =>
        new MaterializedVisitor(peerLibrary, dumpSerialized).print())
}

function getSuperName(clazz: MaterializedClass, resolver:ReferenceResolver): string | undefined {
    const superClass = clazz.superClass
    if (!superClass) return undefined
    const decl = resolver.resolveTypeReference(superClass)
    if (!decl) return undefined
    const nsName = idl.getQualifiedName(decl, 'namespace.name')
    return clazz.isInterface ? getInternalClassName(nsName) : nsName
}

function writeInterface(clazz: MaterializedClass, writer: LanguageWriter) {
    const decl: idl.IDLInterface = clazz.decl
    const superInterface = writer.language == Language.JAVA ? ["Ark_Object"] : undefined
    writer.writeInterface(`${writer.language == Language.CJ ? idl.getNamespaceName(clazz.decl) : ""}${decl.name}`, () => {
        writer.makeStaticBlock(() => {
            for (const p of decl.properties.filter(p => p.isStatic)) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(p.name, writer.language == Language.JAVA ? p.type : maybeOptional(p.type, p.isOptional), modifiers)
            }
        })
        for (const p of decl.properties.filter(p => !p.isStatic)) {
            const modifiers: FieldModifier[] = []
            if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
            writer.writeProperty(p.name, writer.language == Language.JAVA ? p.type : maybeOptional(p.type, p.isOptional), modifiers)
        }
        for (const m of decl.methods) {
            writer.writeMethodDeclaration(m.name,
                new NamedMethodSignature(
                    m.returnType,
                    m.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
                    m.parameters.map(it => it.name)));
        }
    }, superInterface, clazz.generics?.map(sanitizeGenerics))
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
