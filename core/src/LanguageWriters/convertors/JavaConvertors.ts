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

import * as idl from '../../idl'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { lazy } from '../../util'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor } from '../nameConvertor'
import { InteropArgConvertor } from './InteropConvertors'

function convertJavaOptional(type: string): string {
    switch (type) {
        case 'boolean': return  'Opt_Boolean'
        case 'double': return 'Opt_Number'
    }
    return type
}

export class JavaTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {
    constructor(private resolver: ReferenceResolver) { }

    protected solidConvertor = lazy(() => new JavaIdlNodeToSolidStringConvertor(this.resolver))

    convert(node: idl.IDLNode): string {
        const typeString = convertNode<string>(this, node)
        return this.mapTypeName(typeString)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        throw new Error('Method not implemented.'); // TODO: namespace-related-to-rework
    }
    convertInterface(node: idl.IDLInterface): string {
        if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            const javaTypeAliases = node.properties.map(it => convertType(this, idl.maybeOptional(it.type, it.isOptional)))
            return `Tuple_${javaTypeAliases.join('_')}`
        }
        return node.name
    }
    convertEnum(node: idl.IDLEnum): string {
        return node.name
    }
    convertTypedef(node: idl.IDLTypedef): string {
        return node.name
    }

    convertOptional(type: idl.IDLOptionalType): string {
        return convertJavaOptional(this.convert(type.type))
    }
    convertUnion(type: idl.IDLUnionType): string {
        const aliases = type.types.map(it => convertType(this.solidConvertor.value, it))
        return `Union_${aliases.join('_')}`
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const javaType = convertType(this, type.elementType[0])
            return `${javaType}[]`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const javaTypes = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return `Map<${javaTypes[0]}, ${javaTypes[1]}>`
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertCallback(type: idl.IDLCallback): string {
        return `Callback`
    }
    convertMethod(type: idl.IDLMethod): string {
        throw new Error('Method not implemented.'); // TODO: namespace-related-to-rework
    }
    convertConstant(type: idl.IDLConstant): string {
        throw new Error('Method not implemented.'); // TODO: namespace-related-to-rework
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        return type.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }

        const decl = this.resolver.resolveTypeReference(type)!
        if (decl) {
            const declName = this.convert(decl)
            return declName
        }

        if (type.name === `Optional`) {
            return convertJavaOptional(idl.printType(type.typeArguments![0]))
        }
        return type.name
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        // TODO
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLStringType: return 'String'
            case idl.IDLNumberType: return 'double'
            case idl.IDLBooleanType: return 'boolean'
            case idl.IDLUndefinedType: return 'Ark_Undefined'
            case idl.IDLI8Type: return 'byte'
            case idl.IDLU8Type: return 'byte'
            case idl.IDLI16Type: return 'short'
            case idl.IDLU16Type: return 'short'
            case idl.IDLI32Type: return 'int'
            case idl.IDLU32Type: return 'int'
            case idl.IDLI64Type: return 'long'
            case idl.IDLU64Type: return 'long'
            case idl.IDLF32Type: return 'float'
            case idl.IDLF64Type: return 'double'
            case idl.IDLPointerType: return 'long'
            case idl.IDLVoidType: return 'void'
            case idl.IDLDate: return 'Date'
            case idl.IDLBufferType: return 'byte[]'
            case idl.IDLInteropReturnBufferType: return 'byte[]'
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly javaPrimitiveToReferenceTypeMap = new Map([
        ['byte', 'Byte'],
        ['short', 'Short'],
        ['int', 'Integer'],
        ['float', 'Float'],
        ['double', 'Double'],
        ['boolean', 'Boolean'],
        ['char', 'Character'],
    ])
    protected maybeConvertPrimitiveType(javaType: string): string {
        if (this.javaPrimitiveToReferenceTypeMap.has(javaType)) {
            return this.javaPrimitiveToReferenceTypeMap.get(javaType)!
        }
        return javaType
    }

    private mapTypeName(name: string): string {
        switch (name) {
            case 'KPointer': return 'long'
            case 'KBoolean': return 'boolean'
            case 'KUInt': return 'int'
            case 'int32': case 'KInt': return 'int'
            case 'int64': case 'KLong': return 'long'
            case 'float32': case 'KFloat': return 'float'
            case 'KUint8ArrayPtr': return 'byte[]'
            case 'KInt32ArrayPtr': return 'int[]'
            case 'KFloat32ArrayPtr': return 'float[]'
            // case 'ArrayBuffer': return 'byte[]'
            case 'KStringPtr': return 'String'
            case 'string': return 'String'
        }
        return name
    }
}

class JavaIdlNodeToSolidStringConvertor extends JavaTypeNameConvertor {
    protected override solidConvertor = lazy(() => this)

    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const javaTypeSolid = convertType(this, type.elementType[0])
            return `Array_${javaTypeSolid}`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const javaTypeSolids = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return `Map_${javaTypeSolids[0]}_${javaTypeSolids[1]}`
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
}

export class JavaInteropArgConvertor extends InteropArgConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLNumberType: return "double"
            case idl.IDLLengthType: return "String"
            case idl.IDLBooleanType: return "boolean"
        }
        return super.convertPrimitiveType(type)
    }
}
