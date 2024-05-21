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
import { DeclarationTable, PrimitiveType } from "./DeclarationTable"
import { Language, indentedBy, langSuffix } from "../util"
import { createLanguageWriter } from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

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
} from "@koalaui/interop"
`.trim()

export function nativeModuleDeclaration(methods: string[], nativeBridgePath: string, useEmpty: boolean, language: Language): string {
    return `
  ${language == Language.TS ? importTsInteropTypes : ""}
  ${readLangTemplate("NativeModule_prologue", language)
    .replace("%NATIVE_BRIDGE_PATH%", nativeBridgePath)
    .replace("%USE_EMPTY%", useEmpty.toString())}

  ${methods.join("\n  ")}
${readLangTemplate("NativeModule_epilogue", language)}
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

static ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI* impls[${PeerGeneratorConfig.cppPrefix}Ark_APIVariantKind::${PeerGeneratorConfig.cppPrefix}COUNT] = { 0 };

const ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI* GetAnyImpl(${PeerGeneratorConfig.cppPrefix}Ark_APIVariantKind kind, int version, std::string* result) {
    return impls[kind];
}

const ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI* GetFullImpl(std::string* result = nullptr) {
    return reinterpret_cast<const ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI*>(GetAnyImpl(${PeerGeneratorConfig.cppPrefix}Ark_APIVariantKind::${PeerGeneratorConfig.cppPrefix}FULL, ARKUI_FULL_API_VERSION, result));
}

const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* GetNodeModifiers() {
    // TODO: restore the proper call
    // return GetFullImpl()->getNodeModifiers();
    extern const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* GetArkUINodeModifiers();
    return GetArkUINodeModifiers();
}

const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* GetAccessors() {
    // TODO: restore the proper call
    // return GetFullImpl()->getAccessors();
    extern const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* GetArkUIAccessors();
    return GetArkUIAccessors();
}

${bridgeCc.join("\n")}
`
}

export function completeImplementations(lines: string): string {
    return `
#include "Interop.h"
#include "Deserializer.h"
#include "common-interop.h"
#include "delegates.h"

${lines}
`
}

export function completeDelegatesImpl(lines: string): string {
    return `
#include "Deserializer.h"
#include "delegates.h"

${lines}
`
}

export function dummyImplementations(lines: string): string {
    return `
#include "Interop.h"
#include "Deserializer.h"
#include "common-interop.h"

${lines}
`
}

export function modifierStructs(lines: string[]): string {
    return lines.join("\n")
}

export function modifierStructList(lines: string[]): string {
    return `
const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers modifiersImpl = {
    1, // version
${lines.join("\n")}
};

extern const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* GetArkUINodeModifiers()
{
    return &modifiersImpl;
}

`
}

export function accessorStructList(lines: string[]): string {
    return `
const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors accessorsImpl = {
    1, // version
${lines.join("\n")}
};

extern const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* GetArkUIAccessors()
{
    return &accessorsImpl;
}

`
}

export function makeTSSerializer(table: DeclarationTable): string {
    let printer = createLanguageWriter(new IndentedPrinter(), table.language)
    if(table.language == Language.ARKTS) {
        printer.print(`
import {
    AltOffset,
    BackgroundBlurStyleOptions,
    BlurOptions,
    BlurStyle,
    Color,
    CommonAttribute,
    CommonMethod,
    DragInteractionOptions,
    DragPreviewOptions,
    Length,
    Offset,
    Padding,
    Position,
    Resource,
    ResourceStr,
    ResourceColor,
    SheetOptions,
    SheetSize,
    StateStyles,
    SheetTitleOptions
} from "./dts-exports"
`.trim()
        )
    }
    table.generateSerializers(printer)
    return `
import { SerializerBase, runtimeType, Tags, RuntimeType, Function } from "./SerializerBase"
import { int32 } from "@koalaui/common"
import { unsafeCast } from "./generated-utils"

${printer.getOutput().join("\n")}
`
}

export function makeCDeserializer(table: DeclarationTable, structs: IndentedPrinter, typedefs: IndentedPrinter): string {

    const deserializer = createLanguageWriter(new IndentedPrinter(), Language.CPP)
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

export function makeApiModifiers(modifiers: string[], accessors: string[]): string {
    return `
/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers {
    ${PrimitiveType.Int32.getText()} version;
${modifiers.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors {
    ${PrimitiveType.Int32.getText()} version;
${accessors.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIBasicAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIBasicAPI;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUINavigation {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUINavigation;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI;

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI {
    ${PrimitiveType.Int32.getText()} version;
    const ${PeerGeneratorConfig.cppPrefix}ArkUIBasicAPI* (*getBasicAPI)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* (*getNodeModifiers)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* (*getAccessors)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation* (*getAnimation)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUINavigation* (*getNavigation)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI* (*getGraphicsAPI)();
} ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI;
`
}

export function makeApiHeaders(lines: string[]): string {
    return `

${lines.join("\n")}
`
}

function readTemplate(name: string): string {
    return fs.readFileSync(path.join(__dirname, `../templates/${name}`), 'utf8')
}

function readLangTemplate(name: string, lang: Language): string {
    return fs.readFileSync(path.join(__dirname, `../templates/${name + langSuffix(lang)}`), 'utf8')
}


export function makeAPI(
    apiVersion: string,
    headers: string[], modifiers: string[], accessors: string[],
    structs: IndentedPrinter, typedefs: IndentedPrinter
): string {

    let prologue = readTemplate('arkoala_api_prologue.h')
    let epilogue = readTemplate('arkoala_api_epilogue.h')

    prologue = prologue
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, apiVersion)
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)

    return `
${prologue}

${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${makeApiHeaders(headers)}

${makeApiModifiers(modifiers, accessors)}

${epilogue}
`
}

export function copyPeerLib(from: string, to: string) {
    const tsBase = path.join(from, 'ts')
    copyDir(tsBase, to)
    const cppBase = path.join(from, 'cpp')
    copyDir(cppBase, to)
    copyDir(cppBase, to)
    let subdirs = ['node', 'arkts', 'jni']
    subdirs.forEach(subdir => {
        const cppBase = path.join(from, 'cpp', subdir)
        copyDir(cppBase, to)
    })
    copyDir(path.join(from, 'arkts'), to)
    copyDir(path.join(from, 'java'), to)

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

export function makeArkuiModule(componentsFiles: string[]): string {
    return componentsFiles.map(file => {
        const basename = path.basename(file)
        const basenameNoExt = basename.replaceAll(path.extname(basename), "")
        return `export * from "./${basenameNoExt}"`
    }).join("\n")
}

export function makeStructCommon(commonMethods: string[], customComponentMethods: string[]): string {
    return `
import { NativePeerNode } from "@koalaui/arkoala"

// TODO: temporary, remove!
interface Theme {}

export class ArkCommon implements CommonMethod<CommonAttribute> {
  protected peer?: NativePeerNode
  setPeer(peer: NativePeerNode) {
  }
  /** @memo:intrinsic */
  protected checkPriority(
      name: string
  ): boolean { throw new Error("not implemented") }
  protected applyAttributesFinish(): void { throw new Error("not implemented") }

  ${commonMethods.join('\n  ')}
}

export class ArkStructCommon extends ArkCommon implements CustomComponent {
  ${customComponentMethods.join('\n  ')}
}
`
}

export function makeMaterializedPrologue(lang: Language): string {
    let prologue = readLangTemplate('materialized_class_prologue', lang)
    return `
${prologue}

${importTsInteropTypes}

`
}