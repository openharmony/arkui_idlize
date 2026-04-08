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

import * as idl from "@idlizer/core/idl"
import { isMaterialized } from "@idlizer/core"
import { Builders, E, LWExpression, LWStatement, T, Ts, lw } from "@idlizer/ost"
import { expectType, managedName } from "../common.js"
import { OhosProducerContext } from "../../engine/index.js"

const TYPE_CHECKER_CLASS = managedName('engine.TypeChecker')

/** Global collection of TypeChecker class declarations produced during generation */
let pendingTypecheckDeclarations: lw.LWDeclaration[] = []

/** Collect and reset all pending typecheck declarations */
export function collectTypecheckDeclarations(): lw.LWDeclaration[] {
    const result = pendingTypecheckDeclarations
    pendingTypecheckDeclarations = []
    return result
}

/**
 * Determines if a union member type needs a TypeChecker method
 * (i.e., it's a generic type whose type parameters are erased at runtime).
 */
export function needsTypeCheck(type: idl.IDLType, ctx: OhosProducerContext): boolean {
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)) {
        return true
    }
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl)) {
            if (idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName))
                return true
        }
    }
    return false
}

/**
 * Generates a typecheck expression for a union member type.
 * Also produces a TypeChecker class declaration with the corresponding static method.
 * The class declarations are merged later by mergeStructs.
 *
 * @returns [condition expression, declarations to emit]
 */
export function produceTypeCheck(
    type: idl.IDLType,
    accessor: LWExpression,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)) {
        return produceArrayTypeCheck(type, accessor, ctx)
    }
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName)) {
            return produceGenericTypeCheck(type, decl, accessor, ctx)
        }
    }
    throw new Error(`Cannot produce typecheck for type: ${idl.DebugUtils.debugPrintTrace(type)}`)
}

function typeCheckMethodName(type: idl.IDLType, ctx: OhosProducerContext): string {
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)) {
        return 'isArray_' + typeNameSuffix(type.elementType[0], ctx)
    }
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName)) {
            const attr = decl.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.OriginalGenericName)!
            const baseName = attr.value!.split('.').pop()!
            const typeArgSuffix = attr.typesValue?.map(ty => typeNameSuffix(ty, ctx)).join('_') ?? ''
            return 'is' + baseName + '_' + typeArgSuffix
        }
    }
    throw new Error(`Cannot compute typecheck method name for: ${idl.DebugUtils.debugPrintTrace(type)}`)
}

function typeNameSuffix(type: idl.IDLType, ctx: OhosProducerContext): string {
    if (idl.isPrimitiveType(type)) {
        switch (type.name) {
            case 'boolean': return 'Boolean'
            case 'number': return 'Number'
            case 'f32': return 'Float32'
            case 'f64': return 'Float64'
            case 'i32': return 'Int32'
            case 'i64': return 'Int64'
            case 'String': return 'String'
            default: return type.name.charAt(0).toUpperCase() + type.name.slice(1)
        }
    }
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)) {
        return 'Array_' + typeNameSuffix(type.elementType[0], ctx)
    }
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl)) {
            if (idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName)) {
                const attr = decl.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.OriginalGenericName)!
                const baseName = attr.value!.split('.').pop()!
                const typeArgSuffix = attr.typesValue?.map(ty => typeNameSuffix(ty, ctx)).join('_') ?? ''
                return baseName + '_' + typeArgSuffix
            }
            return decl.name.split('.').pop()!
        }
        if (decl && idl.isEnum(decl)) {
            return decl.name.split('.').pop()!
        }
    }
    return idl.printType(type).replace(/[^a-zA-Z0-9]/g, '_')
}

/**
 * Returns the typeof string for a primitive type, or undefined if not a primitive.
 */
function primitiveTypeofString(type: idl.IDLType): string | undefined {
    if (!idl.isPrimitiveType(type)) return undefined
    switch (type.name) {
        case 'boolean': return 'boolean'
        case 'number':
        case 'f32':
        case 'f64':
        case 'i8':
        case 'i32':
        case 'i64':
        case 'u8':
        case 'u32':
        case 'u64': return 'number'
        case 'String': return 'string'
        default: return undefined
    }
}

/**
 * Generate a type check expression for a single value against a type.
 * For primitive types: `typeof value === "boolean"`
 * For enums: `typeof value === "number"` (or "string" for string enums)
 * For generic types: `TypeChecker.isXxx(value)`
 * For arrays: `TypeChecker.isArray_Xxx(value)`
 * For tuples: `value instanceof Array`
 * For other types: `value instanceof Type`
 */
function elementTypeCheck(
    valueExpr: LWExpression,
    elementType: idl.IDLType,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    if (needsTypeCheck(elementType, ctx)) {
        return produceTypeCheck(elementType, valueExpr, ctx)
    }
    // For primitive types, use typeof check
    const typeofStr = primitiveTypeofString(elementType)
    if (typeofStr) {
        return [
            Builders.expr().binary('===')
                .left().call('typeof').arg(valueExpr).$().$()
                .right(E.s(typeofStr)).$().$(),
            []
        ]
    }
    // Resolve reference types
    if (idl.isReferenceType(elementType)) {
        const decl = ctx.library.toDeclaration(elementType)
        if (decl) {
            // For enums, use typeof check
            if (idl.isEnum(decl)) {
                const isStringEnum = decl.elements[0]?.type.name === 'String'
                return [
                    Builders.expr().binary('===')
                        .left().call('typeof').arg(valueExpr).$().$()
                        .right(E.s(isStringEnum ? 'string' : 'number')).$().$(),
                    []
                ]
            }
            // For tuples (which are arrays at runtime), use instanceof Array
            if (idl.isInterface(decl) && idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity) === idl.IDLEntity.Tuple) {
                return [
                    Builders.instanceof(T.c('Array')).value(valueExpr).$(),
                    []
                ]
            }
        }
    }
    // For reference/class types, use instanceof check
    const managedType = expectType(ctx, elementType, 'managed')
    return [
        Builders.instanceof(managedType).value(valueExpr).$(),
        []
    ]
}

function produceArrayTypeCheck(
    type: idl.IDLContainerType,
    accessor: LWExpression,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const methodName = typeCheckMethodName(type, ctx)
    const elemType = type.elementType[0]

    // Generate the body of the typecheck method
    const [elemCheck, innerDecls] = elementTypeCheck(
        Builders.access().receiver('value').index(0).$(),
        elemType,
        ctx
    )

    const body: LWStatement[] = [
        // if (!(value instanceof Array)) return false
        Builders.if()
            .condition(Builders.expr().unary('!').value(
                Builders.instanceof(T.c('Array')).value('value').$()
            ).$().$())
            .then().block()
                .return().value(E.c('false')).$().$().$().$(),
        // if (value.length === 0) return true
        Builders.if()
            .condition(Builders.expr().binary('===')
                .left().access('length').receiver('value').$().$()
                .right(0).$().$())
            .then().block()
                .return().value(E.c('true')).$().$().$().$(),
        // return (<element type check on value[0]>)
        Builders.return().value(elemCheck).$()
    ]

    const classDecl = Builders.class(TYPE_CHECKER_CLASS)
        .method(methodName).static()
            .param('value').type(T.c('object')).$()
            .returns(Ts.prim.boolean)
            .block().statements(body).$().$().$()

    const callExpr = Builders.call(methodName)
        .receiver(E.v('TypeChecker'))
        .arg(accessor).$()

    pendingTypecheckDeclarations.push(classDecl, ...innerDecls)
    return [callExpr, [classDecl, ...innerDecls]]
}

function produceGenericTypeCheck(
    type: idl.IDLReferenceType,
    decl: idl.IDLInterface,
    accessor: LWExpression,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const methodName = typeCheckMethodName(type, ctx)
    const attr = decl.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.OriginalGenericName)!
    const originalName = attr.value!
    const typeArgs = attr.typesValue ?? []

    // Resolve the original generic interface to get its type parameters and properties
    const originalDecl = ctx.library.resolveTypeReference(
        idl.createReferenceType(originalName)
    ) as idl.IDLInterface | undefined

    // Build the base check.
    // For materialized interfaces (classes), use instanceof.
    // For data interfaces (plain objects), use typeof === "object".
    const allDecls: lw.LWDeclaration[] = []
    let checkExpr: LWExpression
    if (originalDecl && isMaterialized(originalDecl, ctx.library)) {
        const originalType = expectType(ctx, originalDecl, 'managed')
        checkExpr = Builders.instanceof(originalType).value('value').$()
    } else {
        checkExpr = Builders.expr().binary('===')
            .left().call('typeof').arg(E.v('value')).$().$()
            .right(E.s('object')).$().$()
    }

    if (originalDecl && originalDecl.typeParameters) {
        const typeParamMap = new Map<string, idl.IDLType>()
        originalDecl.typeParameters.forEach((tp, i) => {
            if (i < typeArgs.length) {
                typeParamMap.set(tp, typeArgs[i])
            }
        })

        for (const prop of originalDecl.properties) {
            // Check if this property's type involves a type parameter
            if (idl.isTypeParameterType(prop.type) && typeParamMap.has(prop.type.name)) {
                const concreteType = typeParamMap.get(prop.type.name)!
                const fieldAccess = Builders.access(prop.name).receiver('value').$()
                const [fieldCheck, fieldDecls] = elementTypeCheck(fieldAccess, concreteType, ctx)
                allDecls.push(...fieldDecls)
                checkExpr = Builders.expr().binary('&&')
                    .left(checkExpr)
                    .right(fieldCheck).$().$()
            }
        }
    }

    const body: LWStatement[] = [
        Builders.return().value(checkExpr).$()
    ]

    const classDecl = Builders.class(TYPE_CHECKER_CLASS)
        .method(methodName).static()
            .param('value').type(T.c('object')).$()
            .returns(Ts.prim.boolean)
            .block().statements(body).$().$().$()

    const callExpr = Builders.call(methodName)
        .receiver(E.v('TypeChecker'))
        .arg(accessor).$()

    pendingTypecheckDeclarations.push(classDecl, ...allDecls)
    return [callExpr, [classDecl, ...allDecls]]
}
