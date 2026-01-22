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
import { getSuperType, LibraryInterface, maybeRestoreGenerics } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"

function superPropsWithTypeArgs(superRef: idl.IDLReferenceType, superDecl: idl.IDLInterface, props: idl.IDLProperty[]) {
    if (superDecl.typeParameters == undefined || superDecl.typeParameters.length == 0) return props
    const superTypeArgs = superRef.typeArguments
    if (superTypeArgs == undefined || superTypeArgs.length == 0) return props
    const superTypeArg = superTypeArgs[0]
    return props.map(prop => {
        const type = prop.type
        if (idl.isReferenceType(type)) {
            // Replace the first type argument with name T to the super type ref
            if (type.typeArguments == undefined || type.typeArguments.length != 1) return prop
            const typeParam = type.typeArguments[0]
            if (idl.isTypeParameterType(typeParam) && typeParam.name == "T") {
                return idl.createProperty(prop.name, idl.createReferenceType(type.name, [superTypeArg]))
            }
        }
        return prop
    })
}

export function getAllSuperProps(
    decl: idl.IDLInterface,
    library: LibraryInterface,
    propCollector: (ref: idl.IDLReferenceType, decl: idl.IDLInterface) => idl.IDLProperty[] = (ref, decl) => decl.properties,
) {
    const superTypes = idl.isClassSubkind(decl)
        ? [getSuperType(decl, library)].flatMap(it => it ? [it] : [])
        : decl.inheritance
    return superTypes.flatMap(superRef => {
        const superDecl = library.resolveTypeReference(superRef)
        if (!superDecl || !idl.isInterface(superDecl)) {
            throw new Error(`Unexpected resolve result for reference ${superRef.name}: ${superDecl}`)
        }
        return propCollector(superRef, superDecl)
    })
}

export function collectProperties(decl: idl.IDLInterface, library: LibraryInterface): idl.IDLProperty[] {
    const superProps = getAllSuperProps(decl, library,
        (superRef, superDecl) => superPropsWithTypeArgs(superRef, superDecl, collectProperties(superDecl, library)))
    const superPropsNames = new Set(superProps.map(it => it.name))
    return [
        ...superProps,
        ...decl.properties.filter(it => !superPropsNames.has(it.name)),
    ].filter(it => !it.isStatic && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.CommonMethod))
}

export function collectMeaninglessProperties(decl: idl.IDLInterface, library: LibraryInterface): idl.IDLProperty[] {
    const superMeaninglessProps = getAllSuperProps(decl, library,
        (_, superDecl) => collectMeaninglessProperties(superDecl, library)
    )
    const meaningfulProperties = collectProperties(decl, library)
    const originalReference = maybeRestoreGenerics(decl, library)
    let original: idl.IDLInterface | undefined
    if (!originalReference || !(original = library.resolveTypeReference(originalReference) as (idl.IDLInterface | undefined)))
        return superMeaninglessProps
    return [
        ...superMeaninglessProps,
        ...original.properties.filter(originalProperty => !meaningfulProperties.some(it => it.name === originalProperty.name))
    ]
}

export function collectAllProperties(decl: idl.IDLInterface, library: LibraryInterface): idl.IDLProperty[] {
    const superTypes = decl.inheritance
    const superDecls = superTypes ? superTypes.map(t => library.resolveTypeReference(t as idl.IDLReferenceType)) : undefined
    return [
        ...distinctValues(
            [
                ...(superDecls ? superDecls.map(decl => collectAllProperties(decl as idl.IDLInterface, library)).flat() : Array()),
                ...decl.properties,
            ]
        )
    ].filter(it => !it.isStatic && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.CommonMethod))
}

export function distinctValues<T>(arr: Array<T>) {
    return [... new Set(arr)]
}