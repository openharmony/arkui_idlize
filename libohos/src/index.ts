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

import * as fs from 'fs'

export * from './launch'
export * from "./DefaultConfiguration"
export * from "./peer-generation/Tracker"
export * from "./peer-generation/ImportsCollector"
export * from './peer-generation/ComponentsCollector'
export * from './peer-generation/PeersCollector'
export * from './peer-generation/common'
export * from './peer-generation/GlobalScopeUtils'
export * from './peer-generation/printers/TargetFile'
export * from './peer-generation/printers/InterfacePrinter'
export * from './peer-generation/printers/OverloadsPrinter'
export * from './peer-generation/printers/MesonPrinter'
export * from './peer-generation/printers/ConvertorsPrinter'
export * from './peer-generation/printers/PeersPrinter'
export * from './peer-generation/printers/StructPrinter'
export * from './peer-generation/printers/BridgeCcPrinter'
export * from './peer-generation/printers/SynthesizedTypesRegistry'
export * from './peer-generation/printers/HeaderPrinter'
export * from './peer-generation/printers/SerializerPrinter'
export * from './peer-generation/printers/GlobalScopePrinter'
export * from './peer-generation/printers/CallbacksPrinter'
export * from './peer-generation/printers/MaterializedPrinter'
export * from './peer-generation/printers/ModifierPrinter'
export * from './peer-generation/printers/ImportTable'
export * from './peer-generation/printers/DeclarationPrinter'
export * from './peer-generation/printers/NativeModulePrinter'
export * from './peer-generation/printers/NativeUtils'
export * from './peer-generation/printers/SourceFile'
export * from './peer-generation/printers/GniPrinter'
export * from './peer-generation/printers/MethodUtils'
export * from './peer-generation/idl/IdlDependenciesCollector'
export * from './peer-generation/idl/IdlPeerGeneratorVisitor'
export * from './peer-generation/idl/DependencySorter'
export * from './peer-generation/idl/SyntheticDeclarationsFiller'
export * from './peer-generation/LayoutManager'
export * from './peer-generation/DeclarationTargetCollector'
export * from './peer-generation/plugin-api'
export * from './peer-generation/ImportsCollectorUtils'
export * from './peer-generation/NativeModule'
export * from './peer-generation/FileGenerators'
export * from './peer-generation/printers/lang/CJ'
export * from './ost/builder'
export * from './ost/builders'
export * from './ost/lws'
export * from './ost'
export * from './ost/stdlib'
export * from './ostgen/engine/context'
export * from './ostgen/engine/utils'
export * from './ostgen/producers'
export * from './ostgen/producers/common'
export * as moduleLike from "./ostgen/postprocess/moduleLike";
export * as lowLevelLike from "./ostgen/postprocess/lowLevelLike";

export class Install {
    mkdir(path: string): string {
        fs.mkdirSync(path, { recursive: true })
        return path
    }
}
