import { fromIDL } from "./from-idl/common"

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
export * from "./config"
export * from "./idl"
export * from "./resolveNamedNode"
export * from "./visitor"
export * from "./library"
export * from "./idlize"
export * from "./inheritance"
export * from "./Language"
export * from "./languageSpecificKeywords"
export * from "./options"
export * from "./util"
export * from "./rand_utils"
export * from "./IndentedPrinter"
export * from "./LibraryInterface"
export * from "./LanguageWriters/LanguageWriter"
export * from "./LanguageWriters/ArgConvertors"
export * from "./LanguageWriters/common"
export * from "./LanguageWriters/nameConvertor"
export * from "./LanguageWriters/convertors/CppConvertors"
export * from "./LanguageWriters/convertors/TSConvertors"
export * from "./LanguageWriters/convertors/ETSConvertors"
export * from "./LanguageWriters/convertors/JavaConvertors"
export * from "./LanguageWriters/convertors/CJConvertors"
export * from "./LanguageWriters/convertors/InteropConvertors"
export * from "./LanguageWriters/convertors/KotlinConvertors"
export * from "./LanguageWriters/writers/CJLanguageWriter"
export * from "./LanguageWriters/writers/CLikeLanguageWriter"
export * from "./LanguageWriters/writers/CppLanguageWriter"
export * from "./LanguageWriters/writers/JavaLanguageWriter"
export * from "./LanguageWriters/writers/TsLanguageWriter"
export * from "./LanguageWriters/writers/ETSLanguageWriter"
export * from "./LanguageWriters/writers/KotlinLanguageWriter"
export * from "./LanguageWriters/nameConvertor"
export * from "./peer-generation/idl/IdlNameConvertor"
export * from "./peer-generation/LayoutManager"
export * from "./peer-generation/PrimitiveType"
export * from "./peer-generation/PeerLibrary"
export * from "./peer-generation/PeerFile"
export * from "./peer-generation/PeerClass"
export * from "./peer-generation/PeerMethod"
export * from "./peer-generation/BuilderClass"
export * from "./peer-generation/Materialized"
export * from "./peer-generation/modules"
export * from "./peer-generation/isMaterialized"
export * from "./peer-generation/isExternalType"
export * from "./peer-generation/isStructureType"
export * from "./peer-generation/isEnumType"
export * from "./peer-generation/unions"
export * from "./peer-generation/getSuperType"

export * from "./LanguageWriters"
export * from "./peer-generation/ReferenceResolver"
export * from "./peer-generation/idl/common"
export * from "./from-idl/IDLLinter"
export { fromIDL, scanIDL }  from "./from-idl/common"
export { idlToDtsString, CustomPrintVisitor }  from "./from-idl/DtsPrinter"
export { toIDLFile, addSyntheticType, resolveSyntheticType, IDLTokenInfoMap } from "./from-idl/deserialize"

export { D, ConfigTypeInfer, ConfigSchema, inspectSchema } from './configDescriber'
