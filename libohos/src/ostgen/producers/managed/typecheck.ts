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
import { expectExpr, expectType, managedName } from "../common.js"
import { createProducer, OhosProducerContext } from "../../engine/index.js"

const TYPE_CHECKER_CLASS = managedName('engine.TypeChecker')

/**
 * A producer that generates TypeChecker static methods for runtime type checking.
 *
 * For non-generic types, generates simple instanceof checks:
 *   static isBoolean(value: object): boolean { return value instanceof boolean }
 *
 * For arrays, generates element-checking methods:
 *   static isArray_Boolean(value: object): boolean { ... }
 *
 * For generic types, generates field-checking methods:
 *   static isSingleGenericType_Number(value: object): boolean { ... }
 *
 * The continuation is a callable expression (TypeChecker.isXxx) that the caller
 * invokes with the value to check: Builders.call(expectExpr(ctx, type, 'typecheck')).arg(accessor).$()
 */
export const typecheckProducer = createProducer(
    { is: isTypecheckable, role: 'typecheck' as any },
    (node, ctx) => {
        const [methodExpr, declarations] = produceTypeCheckForNode(node, ctx)
        return {
            continuation: methodExpr,
            declarations,
        }
    }
)

/** Type guard: any IDL node that can appear in a union type check */
function isTypecheckable(node: idl.IDLNode): node is idl.IDLNode {
    return idl.isPrimitiveType(node)
        || idl.isReferenceType(node)
        || idl.isContainerType(node)
        || idl.isUnionType(node)
        || idl.isInterface(node)
        || idl.isEnum(node)
}

/**
 * Entry point for the producer: handles both IDL types and IDL declarations.
 * For reference types, resolves the reference internally (since this producer
 * is registered before the generic referenceProducer to intercept 'typecheck' role).
 * For declarations (IDLInterface, IDLEnum), generates simple instanceof checks.
 */
function produceTypeCheckForNode(
    node: idl.IDLNode,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    // Handle reference types: resolve and delegate
    if (idl.isReferenceType(node)) {
        const decl = ctx.library.resolveTypeReference(node)
        if (decl && idl.isType(decl)) {
            // Typedef: recurse on the underlying type
            return produceTypeCheckMethod(decl as idl.IDLType, ctx)
        }
        // For reference types with OriginalGenericName or arrays, use produceTypeCheckMethod
        return produceTypeCheckMethod(node, ctx)
    }
    if (idl.isInterface(node) || idl.isEnum(node)) {
        return produceSimpleTypeCheckForDecl(node, ctx)
    }
    return produceTypeCheckMethod(node as idl.IDLType, ctx)
}

/**
 * Simple instanceof check for a declaration node (interface or enum).
 */
function produceSimpleTypeCheckForDecl(
    decl: idl.IDLInterface | idl.IDLEnum,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const shortName = decl.name.split('.').pop()!
    const methodName = 'is' + shortName
    const managedType = expectType(ctx, decl, 'managed')

    // For generic interfaces (with OriginalGenericName), this shouldn't happen
    // since the reference producer passes through. But handle it gracefully.
    let instanceofType: lw.LWType = managedType
    if (idl.isInterface(decl) && idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity) === idl.IDLEntity.Tuple) {
        instanceofType = T.c('Array')
    }

    const body: LWStatement[] = [
        Builders.return().value(
            Builders.instanceof(instanceofType).value('value').$()
        ).$()
    ]

    const classDecl = Builders.class(TYPE_CHECKER_CLASS)
        .method(methodName).static()
            .param('value').type(T.c('object')).$()
            .returns(Ts.prim.boolean)
            .block().statements(body).$().$().$()

    const methodExpr = Builders.access(methodName).receiver('TypeChecker').$()
    return [methodExpr, [classDecl]]
}

/**
 * Produce a TypeChecker method for the given type.
 * Returns [callable expression, declarations].
 */
function produceTypeCheckMethod(
    type: idl.IDLType,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)) {
        return produceArrayTypeCheck(type, ctx)
    }
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName)) {
            return produceGenericTypeCheck(type, decl, ctx)
        }
    }
    // Non-generic type: generate a simple instanceof check
    return produceSimpleTypeCheck(type, ctx)
}

// ---- Method name generation ----

function typeCheckMethodName(type: idl.IDLType, ctx: OhosProducerContext): string {
    if (idl.isPrimitiveType(type)) {
        return 'is' + typeNameSuffix(type, ctx)
    }
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
        if (decl) {
            return 'is' + decl.name.split('.').pop()!
        }
    }
    return 'is' + idl.printType(type).replace(/[^a-zA-Z0-9]/g, '_')
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

// ---- Element type check (used inside TypeChecker method bodies) ----

/**
 * Generate a type check expression for a single value against a type.
 * Used inside TypeChecker method bodies for element/field checks.
 * All checks use instanceof.
 */
function elementTypeCheck(
    valueExpr: LWExpression,
    elementType: idl.IDLType,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    // For generic types and arrays, delegate to a TypeChecker method
    if (isGenericOrArray(elementType, ctx)) {
        const [methodExpr, decls] = produceTypeCheckMethod(elementType, ctx)
        return [
            Builders.call(methodExpr).arg(valueExpr).$(),
            decls
        ]
    }
    // For all other types, use instanceof
    const managedType = resolveInstanceofType(elementType, ctx)
    return [
        Builders.instanceof(managedType).value(valueExpr).$(),
        []
    ]
}

/** Check if a type needs a TypeChecker method (generic or array) */
function isGenericOrArray(type: idl.IDLType, ctx: OhosProducerContext): boolean {
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type))
        return true
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.resolveTypeReference(type)
        if (decl && idl.isInterface(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.OriginalGenericName))
            return true
    }
    return false
}

/** Resolve the type to use in instanceof checks */
function resolveInstanceofType(type: idl.IDLType, ctx: OhosProducerContext): lw.LWType {
    if (idl.isReferenceType(type)) {
        const decl = ctx.library.toDeclaration(type)
        if (decl) {
            // Tuples are arrays at runtime
            if (idl.isInterface(decl) && idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity) === idl.IDLEntity.Tuple) {
                return T.c('Array')
            }
        }
    }
    return expectType(ctx, type, 'managed')
}

// ---- Producers for different type categories ----

/**
 * Simple instanceof check for non-generic types.
 * Generates: static isXxx(value: object): boolean { return value instanceof Xxx }
 */
function produceSimpleTypeCheck(
    type: idl.IDLType,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const methodName = typeCheckMethodName(type, ctx)
    const managedType = resolveInstanceofType(type, ctx)

    const body: LWStatement[] = [
        Builders.return().value(
            Builders.instanceof(managedType).value('value').$()
        ).$()
    ]

    const classDecl = Builders.class(TYPE_CHECKER_CLASS)
        .method(methodName).static()
            .param('value').type(T.c('object')).$()
            .returns(Ts.prim.boolean)
            .block().statements(body).$().$().$()

    const methodExpr = Builders.access(methodName).receiver('TypeChecker').$()
    return [methodExpr, [classDecl]]
}

/**
 * Array type check.
 * Generates:
 *   static isArray_Xxx(value: object): boolean {
 *     if (!(value instanceof Array)) return false
 *     if (value.length === 0) return true
 *     return (value[0] instanceof Xxx)
 *   }
 */
function produceArrayTypeCheck(
    type: idl.IDLContainerType,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const methodName = typeCheckMethodName(type, ctx)
    const elemType = type.elementType[0]

    const [elemCheck, innerDecls] = elementTypeCheck(
        Builders.access().receiver('value').index(0).$(),
        elemType,
        ctx
    )

    const body: LWStatement[] = [
        Builders.if()
            .condition(Builders.expr().unary('!').value(
                Builders.instanceof(T.c('Array')).value('value').$()
            ).$().$())
            .then().block()
                .return().value(E.c('false')).$().$().$().$(),
        Builders.if()
            .condition(Builders.expr().binary('===')
                .left().access('length').receiver('value').$().$()
                .right(0).$().$())
            .then().block()
                .return().value(E.c('true')).$().$().$().$(),
        Builders.return().value(elemCheck).$()
    ]

    const classDecl = Builders.class(TYPE_CHECKER_CLASS)
        .method(methodName).static()
            .param('value').type(T.c('object')).$()
            .returns(Ts.prim.boolean)
            .block().statements(body).$().$().$()

    const methodExpr = Builders.access(methodName).receiver('TypeChecker').$()
    return [methodExpr, [classDecl, ...innerDecls]]
}

/**
 * Generic type check.
 * Generates:
 *   static isSingleGenericType_Number(value: object): boolean {
 *     return value instanceof SingleGenericType && value.value instanceof number
 *   }
 */
function produceGenericTypeCheck(
    type: idl.IDLReferenceType,
    decl: idl.IDLInterface,
    ctx: OhosProducerContext
): [LWExpression, lw.LWDeclaration[]] {
    const methodName = typeCheckMethodName(type, ctx)
    const attr = decl.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.OriginalGenericName)!
    const originalName = attr.value!
    const typeArgs = attr.typesValue ?? []

    const originalDecl = ctx.library.resolveTypeReference(
        idl.createReferenceType(originalName)
    ) as idl.IDLInterface | undefined

    // Base check: instanceof for materialized, instanceof for data interfaces too
    const allDecls: lw.LWDeclaration[] = []
    let checkExpr: LWExpression
    if (originalDecl && isMaterialized(originalDecl, ctx.library)) {
        const originalType = expectType(ctx, originalDecl, 'managed')
        checkExpr = Builders.instanceof(originalType).value('value').$()
    } else {
        // Data interfaces are plain objects; use instanceof with the interface type
        const originalType = originalDecl
            ? T.c(managedName(originalDecl.name))
            : T.c(managedName(originalName))
        checkExpr = Builders.instanceof(originalType).value('value').$()
    }

    if (originalDecl && originalDecl.typeParameters) {
        const typeParamMap = new Map<string, idl.IDLType>()
        originalDecl.typeParameters.forEach((tp, i) => {
            if (i < typeArgs.length) {
                typeParamMap.set(tp, typeArgs[i])
            }
        })

        for (const prop of originalDecl.properties) {
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

    const methodExpr = Builders.access(methodName).receiver('TypeChecker').$()
    return [methodExpr, [classDecl, ...allDecls]]
}
