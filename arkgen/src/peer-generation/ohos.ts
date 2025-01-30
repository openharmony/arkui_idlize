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

import * as path from 'node:path'

import { writeIntegratedFile } from "./common";
import { OhosInstall } from "../Install";
import { PeerLibrary } from "./PeerLibrary";
import { printMaterialized } from "./printers/MaterializedPrinter";
import { printGlobal } from "./printers/GlobalScopePrinter";
import { printDeclarations } from "./printers/DeclarationPrinter";
import { IndentedPrinter, Language, NativeModuleType, setDefaultConfiguration } from "@idlizer/core";
import { makeCallbacksKinds, makeDeserializeAndCall, makeDeserializer, makeOhosModule, makeTSDeserializer, makeTSSerializer, makeTypeChecker, tsCopyrightAndWarning } from "./FileGenerators";
import { printArkUIGeneratedNativeModule } from './printers/NativeModulePrinter';
import { NativeModule } from './NativeModule';
import { TargetFile } from './printers/TargetFile';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { generateNativeOhos, OhosConfiguration, suggestLibraryName } from './OhosGenerator';

interface GenerateOhosConfig {
    dumpSerialized: boolean
    callLog?: boolean
}

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, config?: GenerateOhosConfig) {
    peerLibrary.name = suggestLibraryName(peerLibrary).toLowerCase()

    const params: Record<string, any> = {
        TypePrefix: "OH_",
        LibraryPrefix: `${peerLibrary.name.toUpperCase()}_`,
        OptionalPrefix: "Opt_"
    }
    setDefaultConfiguration(new OhosConfiguration(params))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    NativeModule.Generated = new NativeModuleType(peerLibrary.name.toUpperCase() + 'NativeModule')

    const context = {
        language: peerLibrary.language,
        synthesizedTypes: undefined,
        imports: undefined
    }

    const ohosManagedFiles: string[] = []

    // MANAGED
    /////////////////////////////////////////

    // manged-classes

    const materialized = printMaterialized(peerLibrary, context, config?.dumpSerialized ?? false)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = ohos.materialized(targetFile)
        writeIntegratedFile(outMaterializedFile, materializedClass, "producing")
        ohosManagedFiles.push(outMaterializedFile)
    }

    const globals = printGlobal(peerLibrary)
    for (const [targetFile, content] of globals) {
        const outGlobalFile = ohos.globalFile(targetFile)
        writeIntegratedFile(outGlobalFile, content, "producing")
        ohosManagedFiles.push(outGlobalFile)
    }

    // managed-interop-serializers

    writeIntegratedFile(ohos.peer(new TargetFile('Serializer')),
        makeTSSerializer(peerLibrary).getOutput().join('\n')
    )
    writeIntegratedFile(ohos.peer(new TargetFile('Deserializer')),
        makeDeserializer(peerLibrary)
    )

    // managed-callbacks

    writeIntegratedFile(ohos.peer(new TargetFile('CallbackKind')),
        makeCallbacksKinds(peerLibrary, peerLibrary.language)
    )
    writeIntegratedFile(ohos.peer(new TargetFile('CallbackDeserializeCall')),
        makeDeserializeAndCall(peerLibrary, Language.TS, "./peers/CallbackDeserializeCall.ts").printToString()
    )

    // managed-index

    writeIntegratedFile(path.join(ohos.managedDir(), 'index.ts'),
        makeOhosModule(ohosManagedFiles.map(f => {
            const rel = path.relative(ohos.managedDir(), f)
            if (!rel.startsWith('.')) {
                return `./${rel}`
            }
            return rel
        }))
    )

    // managed-native-module

    writeIntegratedFile(
        ohos.materialized(new TargetFile(NativeModule.Generated.name + peerLibrary.language.extension)),
        printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).printToString()
    )

    // managed-copies

    copyPeerLib(peerLibrary.language, ohos.managedDir())

    // managed-types

    const declarations = printDeclarations(peerLibrary)
    const index = new IndentedPrinter()

    index.print(tsCopyrightAndWarning(''))
    // index.print(readLangTemplate("platform.d.ts", peerLibrary.language))
    for (const data of declarations) {
        index.print(data)
    }
    index.printTo(path.join(ohos.managedDir(), "index.d.ts"))

    // managed-utils

    if (peerLibrary.language === Language.ARKTS) {
        writeIntegratedFile(ohos.peer(new TargetFile('type_check')),
            makeTypeChecker(peerLibrary, Language.ARKTS)
        )
    }

    // NATIVE
    /////////////////////////////////////////

    /*
    const API_VERSION = 0
    const { api, serializers } = printSerializersOhos(API_VERSION, peerLibrary)

    // native-api-generated

    writeIntegratedFile(ohos.native(new TargetFile(`ohos_api_generated.h`)), api)

    // native-bridge

    writeIntegratedFile(
        ohos.native(new TargetFile('bridge_generated.cc')),
        printBridgeCcGenerated(peerLibrary, config?.callLog ?? false)
    )

    writeIntegratedFile(ohos.native(new TargetFile('Serializers.h')), serializers)

    // native-callbacks

    writeIntegratedFile(ohos.native(new TargetFile('callback_kind.h')), makeCallbacksKinds(peerLibrary, Language.CPP))
    writeIntegratedFile(
        ohos.native(new TargetFile('callback_deserialize_call.cc')),
        makeDeserializeAndCall('ohos', peerLibrary, Language.CPP, 'callback_deserialize_call.cc').printToString()
    )
    writeIntegratedFile(
        ohos.native(new TargetFile('callback_managed_caller.cc')),
        printManagedCaller('ohos', peerLibrary).printToString()
    )
    */

    const native = generateNativeOhos(peerLibrary)
    for (const [ file, content ] of native) {
        writeIntegratedFile(ohos.native(file), content)
    }
}

const PEER_LIB_CONFIG = new Map<Language, [string, string][]>()

PEER_LIB_CONFIG.set(Language.TS, [
    [
        path.join('sig', 'arkoala', 'arkui', 'src', 'MaterializedBase.ts'),
        'MaterializedBase.ts'
    ],
    [
        path.join('sig', 'arkoala', 'arkui', 'src', 'shared', 'generated-utils.ts'),
        path.join('shared', 'generated-utils.ts')
    ],
])
PEER_LIB_CONFIG.set(Language.ARKTS, [
    [
        path.join('sig', 'arkoala-arkts', 'arkui', 'src', 'generated', 'MaterializedBase.ts'),
        'MaterializedBase.ts'
    ],
    [
        path.join('sig', 'arkoala-arkts', 'arkui', 'src', 'generated', 'shared', 'generated-utils.ts'),
        path.join('shared', 'generated-utils.ts')
    ]
])

function copyPeerLib(lang: Language, rootDir: string) {
    const list = PEER_LIB_CONFIG.get(lang)
    const peerLibDir = path.resolve(__dirname, '..', 'peer_lib')
    if (list) {
        for (const [src, dst] of list) {
            const resolvedSrc = path.join(peerLibDir, src)
            const resolvedDst = path.join(rootDir, dst)
            const resolvedDstDir = path.dirname(resolvedDst)
            if (!existsSync(resolvedDstDir)) {
                mkdirSync(resolvedDstDir, { recursive: true })
            }
            copyFileSync(resolvedSrc, resolvedDst)
        }
    }
}
