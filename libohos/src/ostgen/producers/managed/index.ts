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

import { containerProducer } from "./containers.js";
import { enumProducer } from "./enum.js";
import { nativeModuleConstructorProducer, nativeModuleFunctionProducer, nativeModuleMaterializedProducer } from "./nativeModule.js";
import { primitiveProducer } from "./primitives.js";
import { referenceProducer } from "./references.js";
import { serializerProducer, typedefSerializerProducer } from "./serializer.js";
import { structureProducer } from "./structure.js";
import { unionProducer } from "./union.js";
import { callbackProducer } from "./callback.js";
import { typedefProducer } from "./typedef.js";
import { constructorProducer, functionProducer } from "./function.js";
import { optionalProducer } from "./optional.js";
import { typeParameterProducer } from "./typeParameter.js";
import { typecheckProducer } from "./typecheck.js";
import { initializerProducer } from "./initializer.js";
import { constProducer } from "./const.js";

export const producers = {
    constProducer,
    enumProducer,
    functionProducer,
    constructorProducer,
    structureProducer,
    primitiveProducer,
    referenceProducer,
    typeParameterProducer,
    optionalProducer,
    containerProducer,
    unionProducer,
    callbackProducer,
    typedefProducer,
    nativeModuleFunctionProducer,
    nativeModuleConstructorProducer,
    nativeModuleMaterializedProducer,
    serializerProducer,
    typedefSerializerProducer,
    typecheckProducer,
    initializerProducer,
}
