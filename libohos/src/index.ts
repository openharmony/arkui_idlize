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

export * from './launch.js'
export * from "./DefaultConfiguration.js"
export * from "./peer-generation/Tracker.js"
export * from "./peer-generation/ImportsCollector.js"
export * from './peer-generation/ComponentsCollector.js'
export * from './peer-generation/PeersCollector.js'
export * from './peer-generation/common.js'
export * from './peer-generation/GlobalScopeUtils.js'
export * from './peer-generation/printers/TargetFile.js'
export * from './peer-generation/printers/InterfacePrinter.js'
export * from './peer-generation/printers/OverloadsPrinter.js'
export * from './peer-generation/printers/MesonPrinter.js'
export * from './peer-generation/printers/ConvertorsPrinter.js'
export * from './peer-generation/printers/PeersPrinter.js'
export * from './peer-generation/printers/StructPrinter.js'
export * from './peer-generation/printers/NativeModuleRecorderPrinter.js'
export * from './peer-generation/printers/BridgePrinter.js'
export * from './peer-generation/printers/SynthesizedTypesRegistry.js'
export * from './peer-generation/printers/HeaderPrinter.js'
export * from './peer-generation/printers/SerializerPrinter.js'
export * from './peer-generation/printers/EnumSupportFunctionPrinter.js'
export * from './peer-generation/printers/GlobalScopePrinter.js'
export * from './peer-generation/printers/CallbacksPrinter.js'
export * from './peer-generation/printers/MaterializedPrinter.js'
export * from './peer-generation/printers/ModifierPrinter.js'
export * from './peer-generation/printers/ImportTable.js'
export * from './peer-generation/printers/DeclarationPrinter.js'
export * from './peer-generation/printers/NativeModulePrinter.js'
export * from './peer-generation/printers/NativeUtils.js'
export * from './peer-generation/printers/SourceFile.js'
export * from './peer-generation/printers/GniPrinter.js'
export * from './peer-generation/printers/MethodUtils.js'
export * from './peer-generation/idl/IdlDependenciesCollector.js'
export * from './peer-generation/idl/IdlPeerGeneratorVisitor.js'
export * from './peer-generation/idl/DependencySorter.js'
export * from './peer-generation/idl/SyntheticDeclarationsFiller.js'
export * from './peer-generation/LayoutManager.js'
export * from './peer-generation/DeclarationTargetCollector.js'
export * from './peer-generation/plugin-api.js'
export * from './peer-generation/ImportsCollectorUtils.js'
export * from './peer-generation/NativeModule.js'
export * from './peer-generation/FileGenerators.js'
export * from './peer-generation/FileGeneratorsUtils.js'
export * from './peer-generation/ModifiersCollector.js'
export * from './peer-generation/printers/lang/CJ.js'
export * from './ostgen/engine/context.js'
export * from './ostgen/engine/utils.js'
export * from './ostgen/producers/index.js'
export * from './ostgen/producers/common.js'
export * from './ostgen/producers/components/argConvertor.js'
export * as moduleLike from "./ostgen/postprocess/moduleLike.js";
export * as lowLevelLike from "./ostgen/postprocess/lowLevelLike.js";

export * from '@idlizer/ost'

export class Install {
    mkdir(path: string): string {
        fs.mkdirSync(path, { recursive: true })
        return path
    }
}
