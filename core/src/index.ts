/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
export * from "./config.js"
export * from "./idl/index.js"
export * from "./resolveNamedNode.js"
export * from "./visitor.js"
export * from "./library.js"
export * from "./inheritance.js"
export * from "./inputPaths.js"
export * from "./Language.js"
export * from "./languageSpecificKeywords.js"
export * from "./util.js"
export * from "./rand_utils.js"
export * from "./IndentedPrinter.js"
export * from "./LibraryInterface.js"
export * from "./diagnostictypes.js"
export * from "./diagnosticmessages.js"
export * from "./formatter.js"
export * from "./LanguageWriters/LanguageWriter.js"
export * from "./LanguageWriters/ArgConvertors.js"
export * from "./LanguageWriters/common.js"
export * from "./LanguageWriters/nameConvertor.js"
export * from "./LanguageWriters/convertors/CppConvertors.js"
export * from "./LanguageWriters/convertors/TSConvertors.js"
export * from "./LanguageWriters/convertors/ETSConvertors.js"
export * from "./LanguageWriters/convertors/CJConvertors.js"
export * from "./LanguageWriters/convertors/InteropConvertors.js"
export * from "./LanguageWriters/convertors/KotlinConvertors.js"
export * from "./LanguageWriters/writers/CJLanguageWriter.js"
export * from "./LanguageWriters/writers/CLikeLanguageWriter.js"
export * from "./LanguageWriters/writers/CppLanguageWriter.js"
export * from "./LanguageWriters/writers/TsLanguageWriter.js"
export * from "./LanguageWriters/writers/ETSLanguageWriter.js"
export * from "./LanguageWriters/writers/KotlinLanguageWriter.js"
export * from "./LanguageWriters/nameConvertor.js"
export * from "./LanguageWriters/TypeComparator.js"
export * from "./peer-generation/idl/IdlNameConvertor.js"
export * from "./peer-generation/LayoutManager.js"
export * from "./peer-generation/PrimitiveType.js"
export * from "./peer-generation/PeerLibrary.js"
export * from "./peer-generation/PeerFile.js"
export * from "./peer-generation/PeerClass.js"
export * from "./peer-generation/PeerMethod.js"
export * from "./peer-generation/Materialized.js"
export * from "./peer-generation/modules.js"
export * from "./peer-generation/isMaterialized.js"
export * from "./peer-generation/isStructureType.js"
export * from "./peer-generation/isEnumType.js"
export * from "./peer-generation/unions.js"
export * from "./peer-generation/getSuperType.js"
export * from "./peer-generation/ConflictingDeclarations.js"
export * from "./peer-generation/Extractors.js"
export * from "./peer-generation/Initializers.js"
export * from "./transformers/FqnTransformer.js"
export * from "./transformers/GenericTransformer.js"
export * from "./transformers/NullTransformer.js"
export * from "./transformers/ThrowsTransformer.js"
export * from "./transformers/OnSerializeTransformer.js"
export * from "./transformers/IdlTransformer.js"
export * from "./transformers/transformUtils.js"

export * from "./ImportCollector.js"
export * from "./LanguageWriters/index.js"
export * from "./peer-generation/ReferenceResolver.js"
export * from "./peer-generation/idl/common.js"
export * from "./from-idl/IDLLinter.js"
export { fromIDL, scanIDL }  from "./from-idl/common.js"
export { idlToDtsString, CustomPrintVisitor }  from "./from-idl/DtsPrinter.js"
export { parseIDLFile, addSyntheticType, resolveSyntheticType, compareNodes, toIdlType } from "./from-idl/deserialize.js"
export { Parser, FatalParserException } from "./from-idl/parser.js"

export { D, ConfigTypeInfer, ConfigSchema, inspectSchema } from './configDescriber.js'
