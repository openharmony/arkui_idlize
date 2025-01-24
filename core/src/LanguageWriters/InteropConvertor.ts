/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from '../idl'
import { convertNode, IdlNameConvertor, NodeConvertor } from "./nameConvertor"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { generatorConfiguration } from '../config'
import { capitalize } from '../util'
import { qualifiedName } from '../peer-generation/idl/common'
import { maybeTransformManagedCallback } from './ArgConvertors'

export interface ConvertResult {
    text: string,
    noPrefix: boolean
}

export class InteropConvertor implements NodeConvertor<ConvertResult> {

    constructor(protected resolver: ReferenceResolver) {}

    private make(text: string, noPrefix = false): ConvertResult {
        return { text, noPrefix }
    }

    convertNode(node: idl.IDLNode): ConvertResult {
        return convertNode<ConvertResult>(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): ConvertResult {
        throw new Error("Internal error: namespaces are not allowed on the interop layer")
    }

    convertInterface(node: idl.IDLInterface): ConvertResult {
        switch (node.subkind) {
            case idl.IDLInterfaceSubkind.AnonymousInterface:
                return node.name
                    ? this.make(node.name)
                    : this.make(this.computeTargetTypeLiteralName(node), true)
            case idl.IDLInterfaceSubkind.Interface:
            case idl.IDLInterfaceSubkind.Class:
                if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Predefined)) {
                    return this.make(node.name, true)
                }
                return this.make(node.name)
            case idl.IDLInterfaceSubkind.Tuple:
                return node.name
                    ? this.make(node.name)
                    : this.make(`Tuple_${node.properties.map(it => this.convertNode(idl.maybeOptional(it.type, it.isOptional)).text).join("_")}`, true)
        }
    }
    convertEnum(node: idl.IDLEnum): ConvertResult {
        return this.make(this.enumName(node))
    }
    convertTypedef(node: idl.IDLTypedef): ConvertResult {
        return this.make(node.name)
    }
    convertCallback(node: idl.IDLCallback): ConvertResult {
        return this.make(generatorConfiguration().param("LibraryPrefix") + node.name, true)
    }
    convertMethod(node: idl.IDLMethod): ConvertResult {
        return this.make(node.name)
    }
    convertConstant(node: idl.IDLConstant): ConvertResult {
        return this.make(node.name)
    }

    /////////////////////////////////////////////////////////////////////////////////////////

    convertOptional(type: idl.IDLOptionalType): ConvertResult {
        return this.convertNode(type.type)
    }
    convertUnion(type: idl.IDLUnionType): ConvertResult {
        return this.make(type.name, false)
    }
    convertContainer(type: idl.IDLContainerType): ConvertResult {
        if (idl.IDLContainerUtils.isPromise(type)) {
            return this.make(`Promise_${this.convertNode(type.elementType[0]).text}`)
        }
        if (idl.IDLContainerUtils.isSequence(type)) {
            if (type.elementType[0] === idl.IDLU8Type) {
                return this.make(`uint8_t*`, true)
            }
            return this.make(`Array_${this.convertNode(type.elementType[0]).text}`, true)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return this.make(`Map_${this.convertNode(type.elementType[0]).text}_${this.convertNode(type.elementType[1]).text}`, true)
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(type: idl.IDLReferenceType, _: string): ConvertResult {
        return this.make(idl.IDLCustomObjectType.name)
    }
    convertTypeReference(type: idl.IDLReferenceType): ConvertResult {
        const refName = type.name
        switch (refName) {
            case "object":
            case "Object":
                return this.make('CustomObject')
        }
        if (generatorConfiguration().paramArray("knownParameterized").includes(refName)) {
            return this.make('CustomObject')
        }
        let decl = this.resolver.toDeclaration(type)
        if (idl.isCallback(decl)) {
            decl = maybeTransformManagedCallback(decl) ?? decl
        }
        if (idl.isType(decl)) {
            if (idl.isReferenceType(decl)) {
                return this.make(`${capitalize(decl.name)}`)
            }
            return this.convertNode(decl)
        }
        let res = this.convertNode(decl as idl.IDLEntry)
        if (type.name === "Optional")
            res = this.make("Opt_" + res.text, true)
        return res
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ConvertResult {
        return this.make('CustomObject')
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ConvertResult {
        switch (type) {
            case idl.IDLVoidType: return this.make('void', true)
            case idl.IDLI8Type: return this.make(`Int8`)
            case idl.IDLU8Type: return this.make(`UInt8`)
            case idl.IDLI16Type: return this.make(`Int16`)
            case idl.IDLU16Type: return this.make(`UInt16`)
            case idl.IDLI32Type: return this.make(`Int32`)
            case idl.IDLU32Type: return this.make(`UInt32`)
            case idl.IDLI64Type: return this.make(`Int64`)
            case idl.IDLU64Type: return this.make(`UInt64`)
            case idl.IDLF32Type: return this.make(`Float32`)
            case idl.IDLF64Type: return this.make(`Float64`)
            case idl.IDLNumberType: return this.make(`Number`)
            case idl.IDLStringType: return this.make(`String`)
            case idl.IDLBooleanType: return this.make(`Boolean`)
            case idl.IDLPointerType: return this.make('NativePointer')
            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType:
            case idl.IDLAnyType: return this.make(`CustomObject`)
            case idl.IDLUndefinedType: return this.make(`Undefined`)
            case idl.IDLLengthType: return this.make(`Length`)
            case idl.IDLFunctionType: return this.make(`Function`)
            case idl.IDLDate: return this.make(`Date`)
            case idl.IDLBufferType: return this.make('Buffer')
            case idl.IDLPointerType: return this.make('Pointer')
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private enumName(target: idl.IDLEnum): string {
        return qualifiedName(target, "_")
    }

    private computeTargetTypeLiteralName(decl: idl.IDLInterface): string {
        const map = new Map<string, string[]>()
        for (const prop of decl.properties) {
            const type = this.convertNode(prop.type)
            const values = map.has(type.text) ? map.get(type.text)! : []
            values.push(prop.name)
            map.set(type.text, values)
        }
        const names = Array.from(map.keys()).map(key => `${key}_${map.get(key)!.join('_')}`)
        return `Literal_${names.join('_')}`
    }
}

export class InteropNameConvertor implements IdlNameConvertor {
    private readonly interopConvertor: InteropConvertor
    constructor(protected resolver: ReferenceResolver) {
        this.interopConvertor = new InteropConvertor(resolver)
    }
    convert(node: idl.IDLNode): string {
        return this.interopConvertor.convertNode(node).text
    }
}
