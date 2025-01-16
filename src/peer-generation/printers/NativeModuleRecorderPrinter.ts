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

import { createInteropArgConvertor, createLanguageWriter, LanguageWriter, Method, NamedMethodSignature } from "../LanguageWriters";
import { createConstructPeerMethod, PeerClassBase } from "../PeerClass";
import { PeerClass } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { ImportsCollector } from "../ImportsCollector";
import { Language } from '@idlize/core'
import {
    createCallback, createParameter, createReferenceType, createTypeParameterReference, createUnionType, IDLExtendedAttributes, IDLI32Type,
    IDLNumberType, IDLObjectType, IDLPointerType, IDLStringType, IDLType, IDLUint8ArrayType, IDLUndefinedType, IDLVoidType
} from "@idlize/core/idl"
import { makeInteropSignature } from "./NativeModulePrinter";
import { InteropArgConvertor } from "../LanguageWriters/convertors/InteropConvertor";
import { generateSyntheticFunctionName } from "../../IDLVisitor";
import { createAlternativeReferenceResolver } from "@idlize/core";

class NativeModuleRecorderVisitor {
    readonly nativeModuleRecorder: LanguageWriter
    private readonly interopConvertor: InteropArgConvertor

    constructor(
        protected readonly library: PeerLibrary,
    ) {
        this.nativeModuleRecorder = createLanguageWriter(library.language, this.library)
        this.interopConvertor = createInteropArgConvertor(library.language)
    }

    private printImports() {
        const imports = new ImportsCollector()
        imports.addFeature("RuntimeType", "./peers/SerializerBase")
        imports.addFeature("Deserializer", "./peers/Deserializer")
        imports.addFeature("unsafeCast", "./shared/generated-utils")
        imports.addFeatures(["int32", "asFloat64", "CustomTextEncoder"], "@koalaui/common")
        imports.addFeatures(["encodeToData", "KFloat", "KFloat32ArrayPtr", "KInt", "KInt32ArrayPtr", "KPointer", "KStringPtr", "KUint8ArrayPtr", "nullptr", "pointer", "KBoolean"], "@koalaui/interop")
        imports.addFeatures(["NodePointer", "NativeModuleEmpty"], "@koalaui/arkoala")
        imports.addFeature("CallbackTransformer", "./peers/CallbackTransformer")
        imports.print(this.nativeModuleRecorder, '')
    }

    private printUiElement() {
        this.nativeModuleRecorder.writeInterface("UIElement", w => {
            w.writeFieldDeclaration("nodeId", IDLI32Type, undefined, false)
            w.writeFieldDeclaration("kind", IDLStringType, undefined, false)
            w.writeFieldDeclaration("children", createReferenceType("Array<UIElement>|undefined"), undefined, false)
            w.writeFieldDeclaration("elementId", createReferenceType("string|undefined"), undefined, false)
        })
    }

    private printPeerMethods(peer: PeerClass) {
        peer.methods.forEach(it => this.printPeerMethod(peer, it, this.nativeModuleRecorder, undefined))
    }

    private printInterface(clazz: PeerClass) {
        this.nativeModuleRecorder.writeInterface(`${clazz.componentName}Interface`, w => {
            for (const method of clazz.methods) {
                for (const arg of method.argAndOutConvertors) {
                    w.print(`${method.overloadedName}_${arg.param}?: ${w.getNodeName(arg.idlType)}`)
                }
            }
        }, clazz.parentComponentName ? [`${clazz.parentComponentName}Interface`, `UIElement`] : undefined)
    }

    private printPeerMethod(clazz: PeerClassBase, method: PeerMethod, nativeModuleRecorder: LanguageWriter, returnType?: IDLType) {
        const component = clazz.generatedName(method.isCallSignature)
        const interfaceName = clazz.getComponentName()
        const parameters = makeInteropSignature(method, returnType, this.interopConvertor)
        let name = `_${component}_${method.overloadedName}`

        nativeModuleRecorder.writeMethodImplementation(new Method(name, parameters), (printer) => {
            this.nativeModuleRecorder.writeLines(`let node = this.ptr2object<${interfaceName}Interface>(${parameters.argsNames[0]})`)
            var deserializerCreated = false
            for (let i = 0; i < method.argAndOutConvertors.length; i++) {
                if (method.argAndOutConvertors[i].useArray) {
                    if (!deserializerCreated) {
                        this.nativeModuleRecorder.writeLines(`const thisDeserializer = new Deserializer(thisArray.buffer, thisLength)`)
                        deserializerCreated = true
                    }

                    const fieldName = `${method.overloadedName}_${method.argAndOutConvertors[i].param}`
                    printer.writeStatement(
                        method.argAndOutConvertors[i].convertorDeserialize(`${fieldName}_buf`, `thisDeserializer`, (expr) => {
                            return printer.makeAssign(`node.${fieldName}`, undefined, expr, false)
                        }, printer)
                    )
                } else {
                    this.nativeModuleRecorder.writeLines(`node.${method.overloadedName}_${method.argAndOutConvertors[i].param} = ${parameters.argsNames[i + 1]}`)
                }
            }
        })
    }

    private printConstructMethod(clazz: PeerClass, nativeModuleRecorder: LanguageWriter) {
        const method = createConstructPeerMethod(clazz)
        const name = `_${method.originalParentName}_${method.overloadedName}`
        const signature = method.method.signature
        const args = signature.args.map((arg, idx) => { return { name: signature.argName(idx), type: arg } })
        const parameters = NamedMethodSignature.make(IDLPointerType, args)

        nativeModuleRecorder.writeMethodImplementation(new Method(name, parameters), (w) => {
            w.writeLines(`let element: UIElement = {`)
            w.pushIndent()
            w.writeLines(`nodeId: 0,`)
            w.writeLines(`kind: '',`)
            w.writeLines(`children: [],`)
            w.writeLines(`elementId: undefined,`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`return this.object2ptr(element)`)
        })
    }

    printOtherField() {
        this.nativeModuleRecorder.writeLines(`const NULL_POINTER = 0`)
        this.nativeModuleRecorder.writeLines(`const FINALIZER_POINTER = 1`)
        this.nativeModuleRecorder.writeInterface("MenuAlign", w => {
            w.writeFieldDeclaration("type", IDLStringType, undefined, false)
            w.writeFieldDeclaration("dx", IDLStringType, undefined, true)
            w.writeFieldDeclaration("dy", IDLStringType, undefined, true)
        })
    }

    printOtherMethods() {
        this.nativeModuleRecorder.writeMethodImplementation(new Method("_ManagedStringWrite", new NamedMethodSignature(IDLI32Type, [IDLStringType, IDLUint8ArrayType, IDLI32Type], ['value', 'buffer', 'offset'])), w => {
            w.writeLines(`if (typeof value === 'number' || value === null)`)
            w.pushIndent()
            w.writeLines(`throw "Not implemented"`)
            w.popIndent()
            w.writeLines(`if (typeof buffer === 'number' || buffer === null)`)
            w.pushIndent()
            w.writeLines(`throw "Not implemented"`)
            w.popIndent()
            w.writeLines(`const encoded = NativeModuleRecorder.textEncoder.encode(value, false)`)
            w.writeLines(`let length = encoded.length + 1 // zero-terminated`)
            w.writeLines(`buffer.set([...encoded, 0], offset)`)
            w.writeLines(`return length`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_CaptureUIStructure", new NamedMethodSignature(IDLPointerType, [], [])), w => {
            w.writeLines(`return this.object2ptr(JSON.stringify({`)
            w.pushIndent()
            w.writeLines(`rootElement: this.rootElement`)
            w.popIndent()
            w.writeLines(`}))`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("private ptr2object<T>", new NamedMethodSignature(createTypeParameterReference("T"), [IDLPointerType], ["ptr"])), w => {
            w.writeLines(`return this.pointers[ptr as number] as T`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("private object2ptr", new NamedMethodSignature(IDLPointerType, [createUnionType([IDLObjectType, IDLUndefinedType])], ["object"])), w => {
            w.writeLines(`if (object == null) return nullptr`)
            w.writeLines(`for (let i = 1; i < this.pointers.length; i++) {`)
            w.pushIndent()
            w.writeLines(`if (this.pointers[i] == null) {`)
            w.pushIndent()
            w.writeLines(`this.pointers[i] = object`)
            w.writeLines(`return i`)
            w.popIndent()
            w.writeLines(`}`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`let ptr = this.pointers.length`)
            w.writeLines(`this.pointers.push(object)`)
            w.writeLines(`return ptr`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_StringLength", new NamedMethodSignature(IDLI32Type, [IDLPointerType], ["ptr"])), w => {
            w.writeLines(`return this.ptr2object<string>(ptr).length`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_StringData", new NamedMethodSignature(IDLVoidType, [IDLPointerType, IDLUint8ArrayType, IDLNumberType], ["ptr", "buffer", "length"])), w => {
            w.writeLines(`let value = this.ptr2object<string>(ptr);`)
            w.writeLines(`(buffer as Uint8Array).set(encodeToData(value))`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_GetStringFinalizer", new NamedMethodSignature(IDLPointerType, [], [])), w => {
            w.writeLines(`return FINALIZER_POINTER as pointer`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_InvokeFinalizer", new NamedMethodSignature(IDLVoidType, [IDLPointerType, IDLPointerType], ["ptr", "finalizer"])), w => {
            w.writeLines(`let finalizerFunc = this.ptr2object<(obj: pointer) => void>(finalizer)`)
            w.writeLines(`finalizerFunc(ptr)`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_CreateNode", new NamedMethodSignature(/* IDLNodePointer ? */ IDLPointerType /* NodePointer */, [IDLI32Type, IDLI32Type, IDLI32Type], ["type", "id", "flags"])), w => {
            w.writeLines(`let element: UIElement = {`)
            w.pushIndent()
            w.writeLines(`nodeId: id,`)
            w.writeLines(`kind: this.nameByNodeType(type),`)
            w.writeLines(`children: [],`)
            w.writeLines(`elementId: undefined,`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`if (type == 0 /* ArkUINodeType.Root */) {`)
            w.pushIndent()
            w.writeLines(`this.rootElement = element`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`return this.object2ptr(element)`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_DisposeNode", new NamedMethodSignature(IDLVoidType, [IDLPointerType /* NodePointer */], ["ptr"])), w => {
            w.writeLines(`let node = this.ptr2object<UIElement|null>(ptr)`)
            w.writeLines(`console.log("Dispose", node)`)
            w.writeLines(`if (node?.elementId) this.nodeById.delete(node.elementId)`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_AddChild", new NamedMethodSignature(IDLNumberType, [IDLPointerType, IDLPointerType], ["ptr1", "ptr2"])), w => {
            w.writeLines(`let parent = this.ptr2object<UIElement|null>(ptr1)`)
            w.writeLines(`let child = this.ptr2object<UIElement|null>(ptr2)`)
            w.writeLines(`parent?.children?.push(child!)`)
            w.writeLines(`return 0`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_RemoveChild", new NamedMethodSignature(IDLVoidType, [IDLPointerType /* NodePointer */, IDLPointerType /* NodePointer */], ["parentPtr", "childPtr"])), w => {
            w.writeLines(`let parent = this.ptr2object<UIElement|null>(parentPtr)`)
            w.writeLines(`let child = this.ptr2object<UIElement|null>(childPtr)`)
            w.writeLines(`parent?.children?.forEach((element, index) => {`)
            w.pushIndent()
            w.writeLines(`if (element == child) {`)
            w.pushIndent()
            w.writeLines(`parent?.children?.splice(index, 1)`)
            w.popIndent()
            w.writeLines(`}`)
            w.popIndent()
            w.writeLines(`})`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_InsertChildAfter", new NamedMethodSignature(IDLNumberType, [IDLPointerType, IDLPointerType, IDLPointerType], ["ptr0", "ptr1", "ptr2"])), w => {
            w.writeLines(`let parent = this.ptr2object<UIElement|null>(ptr0)`)
            w.writeLines(`let child = this.ptr2object<UIElement|null>(ptr1)`)
            w.writeLines(`let sibling = this.ptr2object<UIElement|null>(ptr2)`)
            w.writeLines(`if (sibling) {`)
            w.pushIndent()
            w.writeLines(`let inserted = false`)
            w.writeLines(`parent?.children?.forEach((element, index) => {`)
            w.pushIndent()
            w.writeLines(`if (element == sibling) {`)
            w.pushIndent()
            w.writeLines(`inserted = true`)
            w.writeLines(`parent?.children?.splice(index + 1, 0, child!)`)
            w.popIndent()
            w.writeLines(`}`)
            w.popIndent()
            w.writeLines(`})`)
            w.writeLines(`if (!inserted) throw Error("Cannot find sibling to insert")`)
            w.popIndent()
            w.writeLines(`} else {`)
            w.pushIndent()
            w.writeLines(`if (child) parent?.children?.push(child)`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`return 0`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_InsertChildBefore", new NamedMethodSignature(IDLNumberType, [IDLPointerType, IDLPointerType, IDLPointerType], ["ptr0", "ptr1", "ptr2"])), w => {
            w.writeLines(`let parent = this.ptr2object<UIElement|null>(ptr0)`)
            w.writeLines(`let child = this.ptr2object<UIElement|null>(ptr1)`)
            w.writeLines(`let sibling = this.ptr2object<UIElement|null>(ptr2)`)
            w.writeLines(`if (sibling) {`)
            w.pushIndent()
            w.writeLines(`let inserted = false`)
            w.writeLines(`parent?.children?.forEach((element, index) => {`)
            w.pushIndent()
            w.writeLines(`if (element == sibling) {`)
            w.pushIndent()
            w.writeLines(`inserted = true`)
            w.writeLines(`parent?.children?.splice(index - 1, 0, child!)`)
            w.popIndent()
            w.writeLines(`}`)
            w.popIndent()
            w.writeLines(`})`)
            w.writeLines(`if (!inserted) throw Error("Cannot find sibling to insert")`)
            w.popIndent()
            w.writeLines(`} else {`)
            w.pushIndent()
            w.writeLines(`if (child) parent?.children?.push(child)`)
            w.popIndent()
            w.writeLines(`}`)
            w.writeLines(`return 0`)
        })

        this.nativeModuleRecorder.writeMethodImplementation(new Method("_InsertChildAt", new NamedMethodSignature(IDLNumberType, [IDLPointerType, IDLPointerType, IDLNumberType], ["ptr0", "ptr1", "arg"])), w => {
            w.writeLines(`let parent = this.ptr2object<UIElement|null>(ptr0)`)
            w.writeLines(`let child = this.ptr2object<UIElement|null>(ptr1)`)
            w.writeLines(`let inserted = false`)
            w.writeLines(`parent?.children?.forEach((element, index) => {`)
            w.pushIndent()
            w.writeLines(`if (index == arg) {`)
            w.pushIndent()
            w.writeLines(`inserted = true`)
            w.writeLines(`parent?.children?.splice(index, 0, child!)`)
            w.popIndent()
            w.writeLines(`}`)
            w.popIndent()
            w.writeLines(`})`)
            w.writeLines(`if (!inserted) throw Error("Cannot find sibling to insert")`)
            w.writeLines(`return 0`)
        })

        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printConstructMethod(peer, this.nativeModuleRecorder)
            }
        }
    }

    printClassField() {
        this.nativeModuleRecorder.writeLines(`private pointers = new Array<Object|null>(2)`)
        this.nativeModuleRecorder.writeLines(`private nameByNodeType: (type: int32) => string`)
        this.nativeModuleRecorder.writeLines(`rootElement: UIElement | undefined = undefined`)
        this.nativeModuleRecorder.writeLines(`private static readonly textEncoder = new CustomTextEncoder()`)
        this.nativeModuleRecorder.writeLines(`private nodeById = new Map<string, UIElement>()`)
    }

    printConstructor(writer: LanguageWriter) {
        const callbackParameters = [createParameter('type', IDLI32Type)]
        const callbackName = generateSyntheticFunctionName(callbackParameters, IDLStringType)
        const callback = createCallback(callbackName, callbackParameters, IDLStringType,
            { extendedAttributes: [{name: IDLExtendedAttributes.Synthetic}]})
        const alternativeResolver = createAlternativeReferenceResolver(this.library, new Map([[
            callbackName, callback
        ]]))
        const alternativeWriter = writer.fork({resolver: alternativeResolver})
        alternativeWriter.writeConstructorImplementation("NativeModuleRecorder", new NamedMethodSignature(IDLVoidType, [createReferenceType(callbackName)], ["nameByNodeType"]), w => {
            w.writeSuperCall([])
            w.writeLines(`this.nameByNodeType = nameByNodeType`)
            w.writeLines(`this.pointers[NULL_POINTER] = null`)
            w.writeLines(`this.pointers[FINALIZER_POINTER] = (ptr: pointer) => { this.pointers[ptr as number] = null }`)
        })
        writer.concat(alternativeWriter)
    }

    print(): void {

        this.printImports()

        this.printUiElement()
        this.printOtherField()

        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printInterface(peer)
            }
        }

        this.nativeModuleRecorder.writeClass("NativeModuleRecorder", w => {

            this.printClassField()
            this.printConstructor(w)
            this.printOtherMethods()

            for (const file of this.library.files) {
                for (const peer of file.peersToGenerate.values()) {
                    this.printPeerMethods(peer)
                }
            }
        }, "NativeModuleEmpty")
        this.nativeModuleRecorder.popIndent()
    }
}

export function printNativeModuleRecorder(library: PeerLibrary): string {
    let visitor
    switch (library.language) {
        case Language.TS:
            visitor = new NativeModuleRecorderVisitor(library)
            break
        default:
            throw new Error("Not implemented yet")
    }
    visitor.print()
    return visitor.nativeModuleRecorder.printer.getOutput().join("\n")
}
