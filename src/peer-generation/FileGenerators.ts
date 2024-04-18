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

const importTsInteropTypes = `
import {
    int32,
    float32
} from "@koalaui/common"
import {
    KInt,
    KBoolean,
    KStringPtr,
    KPointer,
    KNativePointer,
    KInt32ArrayPtr,
    KUint8ArrayPtr,
    pointer
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

export type NodePointer = pointer

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
#include "arkoala_api.h"
#include "Deserializer.h"

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
import { int32 } from "@koalaui/common"

${printer.getOutput().join("\n")}
`
}

export function makeCDeserializer(table: DeclarationTable, structs: IndentedPrinter, typedefs: IndentedPrinter): string {

    const deserializer = new IndentedPrinter()
    const writeToString = new IndentedPrinter()
    table.generateDeserializers(deserializer, structs, typedefs, writeToString)

    return `
#include "Interop.h"
#include "ArgDeserializerBase.h"
#include "arkoala_api.h"
#include <string>

${writeToString.getOutput().join("\n")}

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
typedef struct ArkUINodeModifiers {
    KInt version;
${lines.join("\n")}
} ArkUINodeModifiers;

typedef struct ArkUIBasicAPI {
    KInt version;
} ArkUIBasicAPI;

typedef struct ArkUIAnimation {
    KInt version;
} ArkUIAnimation;

typedef struct ArkUINavigation {
    KInt version;
} ArkUINavigation;

typedef struct ArkUIGraphicsAPI {
    KInt version;
} ArkUIGraphicsAPI;

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
typedef struct ArkUIFullNodeAPI {
    KInt version;
    const ArkUIBasicAPI* (*getBasicAPI)();
    const ArkUINodeModifiers* (*getNodeModifiers)();
    const ArkUIAnimation* (*getAnimation)();
    const ArkUINavigation* (*getNavigation)();
    const ArkUIGraphicsAPI* (*getGraphicsAPI)();
} ArkUIFullNodeAPI;

typedef struct ArkUIAnyAPI {
    KInt version;
} ArkUIAnyAPI;
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
export function makeAPI(headers: string[], modifiers: string[], structs: IndentedPrinter, typedefs: IndentedPrinter): string {

    let structsBase = fs.readFileSync('./templates/StructsBase.h','utf8');

    return `
#ifndef ARKOALA_API_H_
#define ARKOALA_API_H_

// TBD: Change K to ArkUI types
#include <stdint.h>
typedef int32_t KInt;
typedef int8_t KBoolean;

typedef int8_t Boolean;

typedef void* ArkUINodeHandle;

enum Tags
{
  TAG_UNDEFINED = 101,
  TAG_INT32 = 102,
  TAG_FLOAT32 = 103,
  TAG_STRING = 104,
  TAG_LENGTH = 105,
  TAG_RESOURCE = 106,
  TAG_OBJECT = 107,
};

${structsBase}

${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${makeApiHeaders(headers)}

${makeApiModifiers(modifiers)}

#endif // ARKOALA_API_H_
`
}

export function copyPeerLib(from: string, to: string) {
    const tsBase = path.join(from, 'ts')
    copyDir(tsBase, to)
    const cppBase = path.join(from, 'cpp')
    copyDir(cppBase, to)
    copyDir(cppBase, to)
    let subdirs = ['node', 'ark']
    subdirs.forEach(subdir => {
        const cppBase = path.join(from, 'cpp', subdir)
        copyDir(cppBase, to)
    })
}

function copyDir(from: string, to: string) {
    fs.readdirSync(from).forEach(it => {
        let file = path.join(from, it)
        if (fs.statSync(file).isFile()) {
            fs.copyFileSync(file, path.join(to, it))
        }
        // TODO: copy dir
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