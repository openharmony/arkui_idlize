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
import * as fs from "fs"
import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter"
import { DeclarationTable } from "./DeclarationTable"
import { SortingEmitter } from "./SortingEmitter"

const importTsInteropTypes = `
import {
    int32,
    float32,
    KInt,
    KBoolean,
    KStringPtr,
    KPointer,
    KNativePointer,
    Int32ArrayPtr,
    KUint8ArrayPtr,
} from "./types"
import {
    NativeStringBase,
    withByteArray,
    Access,
    providePlatformDefinedData,
    nullptr
} from "./Interop"
`.trim()

export function nativeModuleDeclaration(methods: string[], nativeBridgePath: string, useEmpty: boolean): string {
    // TODO: better NativeBridge loader
    return `
${importTsInteropTypes}
import { NativeModuleEmpty } from "./NativeModuleEmpty"

export type NodePointer = KNativePointer // the real arkoala uses "pointer" here

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    if (${useEmpty})
        theModule = new NativeModuleEmpty()
    else
        theModule = require("${nativeBridgePath}") as NativeModule
    return theModule
}

class NativeString extends NativeStringBase {
    constructor(ptr: KPointer) {
        super(ptr)
    }
    protected bytesLength(): int32 {
        return nativeModule()._StringLength(this.ptr)
    }
    protected getData(data: Uint8Array): void {
        withByteArray(data, Access.WRITE, (dataPtr: KUint8ArrayPtr) => {
            nativeModule()._StringData(this.ptr, dataPtr, data.length)
        })
    }
    close(): void {
        nativeModule()._InvokeFinalizer(this.ptr, nativeModule()._GetStringFinalizer())
        this.ptr = nullptr
    }
}

providePlatformDefinedData({
    nativeString(ptr: KPointer): NativeStringBase { return new NativeString(ptr) }
})

export interface NativeModule {
  _GetGroupedLog(index: KInt): KPointer;
  _ClearGroupedLog(index: KInt): void;
  _GetStringFinalizer(): KPointer;
  _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void;
  _StringLength(ptr: KPointer): KInt;
  _StringData(ptr: KPointer, buffer: KUint8ArrayPtr, length: KInt): void;
  _StringMake(value: KStringPtr): KPointer;

${methods.map(it => `  ${it}`).join("\n")}
}
`
}

export function nativeModuleEmptyDeclaration(methods: string[]): string {
    return `
${importTsInteropTypes}
import { NativeModuleBase } from "./NativeModuleBase"
import { NativeModule, NodePointer } from "./NativeModule"

export class NativeModuleEmpty extends NativeModuleBase implements NativeModule {
${methods.join("\n")}
}
`.trim()
}

export function bridgeCcDeclaration(bridgeCc: string[]): string {
    return `#include "Interop.h"
#include "Deserializer.h"
#include "arkoala_api.h"

static ArkUIAnyAPI* impls[ArkUIAPIVariantKind::COUNT] = { 0 };

const ArkUIAnyAPI* GetAnyImpl(ArkUIAPIVariantKind kind, int version, std::string* result) {
    return impls[kind];
}

const ArkUIFullNodeAPI* GetFullImpl(std::string* result = nullptr) {
    return reinterpret_cast<const ArkUIFullNodeAPI*>(GetAnyImpl(ArkUIAPIVariantKind::FULL, ARKUI_FULL_API_VERSION, result));
}

const ArkUINodeModifiers* GetNodeModifiers() {
    // TODO: restore the proper call
    // return GetFullImpl()->getNodeModifiers();
    extern const ArkUINodeModifiers* GetArkUINodeModifiers();
    return GetArkUINodeModifiers();
}

${bridgeCc.join("\n")}
`
}

export function dummyImplementations(lines: string[]): string {
    return `
#include "Interop.h"
#include "Deserializer.h"
#include "arkoala_api.h"
#include "common-interop.h"

${lines.join("\n")}
`
}

export function dummyModifiers(lines: string[]): string {
    return lines.join("\n")
}

export function dummyModifierList(lines: string[]): string {
    return `
const ArkUINodeModifiers impl = {
    1, // version
${lines.join("\n")}
};

extern const ArkUINodeModifiers* GetArkUINodeModifiers()
{
    return &impl;
}

`
}

export function makeTSSerializer(table: DeclarationTable): string {
    let printer = new IndentedPrinter()
    table.generateSerializers(printer)
    return `
import { SerializerBase, runtimeType, Tags, RuntimeType, Function } from "./SerializerBase"
import { int32 } from "./types"

${printer.getOutput().join("\n")}
`
}

export function makeCDeserializer(table: DeclarationTable): string {
    const deserializer = new IndentedPrinter()
    const structs = new SortingEmitter(table)
    const typedefs = new IndentedPrinter()

    table.generateDeserializers(deserializer, structs, typedefs)

    return `
#include "Interop.h"
#include "ArgDeserializerBase.h"
#include <string>

${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${deserializer.getOutput().join("\n")}
`
}

export function makeApiModifiers(lines: string[]): string {
    return `
/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
struct ArkUINodeModifiers {
    KInt version;
${lines.join("\n")}
};

struct ArkUIBasicAPI {
    KInt version;
};

struct ArkUIAnimation {
    KInt version;
};

struct ArkUINavigation {
    KInt version;
};

struct ArkUIGraphicsAPI {
    KInt version;
};

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
struct ArkUIFullNodeAPI {
    KInt version;
    const ArkUIBasicAPI* (*getBasicAPI)();
    const ArkUINodeModifiers* (*getNodeModifiers)();
    const ArkUIAnimation* (*getAnimation)();
    const ArkUINavigation* (*getNavigation)();
    const ArkUIGraphicsAPI* (*getGraphicsAPI)();
};

struct ArkUIAnyAPI {
    KInt version;
};
`
}

export function makeApiHeaders(lines: string[]): string {
    return `
enum ArkUIAPIVariantKind {
    BASIC = 1,
    FULL = 2,
    GRAPHICS = 3,
    EXTENDED = 4,
    COUNT = EXTENDED + 1,
};

${lines.join("\n")}
`
}

export function copyPeerLib(from: string, to: string) {
    const tsBase = path.join(from, 'ts')
    fs.readdirSync(tsBase).forEach(it => {
        fs.copyFileSync(path.join(tsBase, it), path.join(to, it))
    })
    const cppBase = path.join(from, 'cpp')
    fs.readdirSync(cppBase).forEach(it => {
        let input = path.join(cppBase, it)
        if (fs.lstatSync(input).isFile())
            fs.copyFileSync(input, path.join(to, it))
    })
    const cppBaseNode = path.join(from, 'cpp', 'node')
    fs.readdirSync(cppBaseNode).forEach(it => {
        fs.copyFileSync(path.join(cppBaseNode, it), path.join(to, it))
    })
}

export function makeNodeTypes(types: string[]): string {
    const enumValues = types.map(it => `  ${it},`).join("\n")
    return `
export enum ArkUINodeType { 
${enumValues}
}
`.trim()
}