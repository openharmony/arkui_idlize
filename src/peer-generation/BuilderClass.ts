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

import { Field, Method, MethodModifier, MethodSignature, NamedMethodSignature } from "./LanguageWriters"
import { ImportFeature } from "./ImportsCollector"
import { Language } from "../Language";
import { PeerLibrary } from "./PeerLibrary";
import { convertTypeToFeature } from "./idl/IdlPeerGeneratorVisitor";
import { createConstructor, createInterface, createMethod, createParameter, createReferenceType, IDLInterface, IDLInterfaceSubkind, IDLKind, IDLReferenceType, IDLThisType, IDLType, IDLVoidType } from "../idl"

function builderMethod(name: string, type: IDLType): Method {
    return new Method(name, new NamedMethodSignature(IDLThisType, [type], ["value"]))
}

export class BuilderClass {
    constructor(
        public readonly declaration: IDLInterface,
        public readonly name: string,
        public readonly generics: string[] | undefined,
        public readonly isInterface: boolean,
        public readonly superClass: IDLReferenceType | undefined,
        public readonly fields: Field[],
        public readonly constructors: Method[],
        public readonly methods: Method[],
        // public readonly importFeatures: ImportFeature[],
        public readonly needBeGenerated: boolean = true,
    ) { }
}

export const CUSTOM_BUILDER_CLASSES: BuilderClass[] = []
const CUSTOM_BUILDER_CLASSES_SET: Set<String> = new Set()

export function initCustomBuilderClasses(library: PeerLibrary) {
    const decl = createInterface(
        "Indicator",
        IDLInterfaceSubkind.Class,
        [],
        [createConstructor([], undefined)],
        undefined,
        undefined,
        [
            ...["left", "top", "right", "bottom"].map(it => createMethod(it, 
                [createParameter("value", createReferenceType("Length"))],
                IDLThisType,
            )),
            ...["start", "end"].map(it => createMethod(it, 
                [createParameter(`value`, createReferenceType("LengthMetrics"))], 
                IDLThisType,
            )),
            createMethod(`dot`, [], createReferenceType(`DotIndicator`)),
            createMethod(`digit`, [], createReferenceType(`DigitIndicator`)),
        ]
    )
    CUSTOM_BUILDER_CLASSES.push(
        new BuilderClass(decl, "Indicator", ["T"], false, undefined,
            [], // fields
            [new Method("constructor", new MethodSignature(IDLVoidType, []))],
            [
                ...["left", "top", "right", "bottom"].map(it => builderMethod(it, createReferenceType("Length"))),
                ...["start", "end"].map(it => builderMethod(it, createReferenceType("LengthMetrics"))),
                new Method("dot", new MethodSignature(createReferenceType("DotIndicator"), []), [MethodModifier.STATIC]),
                new Method("digit", new MethodSignature(createReferenceType("DigitIndicator"), []), [MethodModifier.STATIC]),
            ],
            // [], // imports
        )
    )

    CUSTOM_BUILDER_CLASSES.forEach(it => {
        // if (library.language === Language.ARKTS) {
        //     it.importFeatures.push(
        //         ...it.methods.flatMap(it => [...it.signature.args, it.signature.returnType])
        //             .map(it => convertTypeToFeature(library, it))
        //             .filter((it) : it is ImportFeature => it !== undefined)
        //     )
        // }
        CUSTOM_BUILDER_CLASSES_SET.add(it.name)
    })
}

export function isCustomBuilderClass(name: string) {
    return CUSTOM_BUILDER_CLASSES_SET.has(name)
}

export function methodsGroupOverloads(methods: Method[]): Method[][] {
    const seenNames = new Set<string>()
    const groups: Method[][] = []
    for (const method of methods) {
        if (seenNames.has(method.name))
            continue
        seenNames.add(method.name)
        groups.push(methods.filter(it => it.name === method.name))
    }
    return groups
}
