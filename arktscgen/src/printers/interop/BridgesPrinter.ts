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

import {
    ArgumentModifier,
    CppLanguageWriter,
    createEmptyReferenceResolver,
    IDLMethod,
    IndentedPrinter,
    isVoidType,
    LanguageExpression,
    LanguageStatement,
    MethodSignature,
    PrimitiveType,
    PrimitiveTypeList
} from "@idlizer/core"
import { createReferenceType, IDLFile, IDLInterface, IDLType, IDLVoidType } from "@idlizer/core/idl"
import { BridgesConstructions } from "../../constuctions/BridgesConstructions"
import { InteropPrinter } from "./InteropPrinter"
import { isSequence, isString, makeSignature, makeStatement } from "../../utils/idl"
import { ReturnTypeConvertor } from "../../type-convertors/interop/bridges/ReturnTypeConvertor"
import { InteropMacroTypeConvertor } from "../../type-convertors/interop/bridges/InteropMacroTypeConvertor"
import { NativeTypeConvertor } from "../../type-convertors/interop/bridges/NativeTypeConvertor"
import { CastTypeConvertor } from "../../type-convertors/interop/bridges/CastTypeConvertor"
import { Config } from "../../general/Config"
import { isCreateOrUpdate, isImplInterface, mangleIfKeyword } from "../../general/common"
import { InteropConstructions } from "../../constuctions/InteropConstructions"
import { BaseTypeConvertor } from "../../type-convertors/BaseTypeConvertor"

export class BridgesPrinter extends InteropPrinter {
    constructor(private config: Config, file: IDLFile) {
        super(file)
    }

    private castTypeConvertor = new CastTypeConvertor(this.typechecker)
    private nativeTypeConvertor = new NativeTypeConvertor(this.typechecker)
    private returnTypeConvertor = new ReturnTypeConvertor(this.typechecker)
    private interopMacroConvertor = new InteropMacroTypeConvertor(this.typechecker)

    protected writer = new CppLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => this.nativeTypeConvertor.convertType(node) },
        new class extends PrimitiveTypeList {
            Undefined = new PrimitiveType(`undefined`)
            Void: PrimitiveType = new PrimitiveType(`void`)
        }()
    )

    protected printMethod(iface: IDLInterface, node: IDLMethod): void {
        if (this.config.ignore.isIgnoredMethod(iface.name, node.name)) return

        const [methodName, signature] = BridgesPrinter.makeFunctionDeclaration(iface, node, this.returnTypeConvertor)
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(methodName), signature,
            (_) => {
                let pandaMethodName = BridgesConstructions.callMethod(methodName)
                if (this.config.irHack.isIrHackInterface(iface.name)) {
                    pandaMethodName = pandaMethodName.replace(iface.name, `${iface.name}Ir`)
                }
                this.printBody(node, signature, pandaMethodName)
            }
        )

        this.printInteropMacro(methodName, signature)
        this.writer.writeLines(``)
    }

    private printInteropMacro(methodName: string, signature: MethodSignature): void {
        const isVoid = isVoidType(signature.returnType)
        const args: string[] = (isVoid ? [] : [signature.returnType])
            .concat(signature.args)
            .map(a => this.interopMacroConvertor.convertType(a))
        args.splice(0, 0, methodName)

        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                BridgesConstructions.interopMacro(isVoid, signature.args.length),
                args.map(it => this.writer.makeString(it))
            )
        )
    }

    public static makeFunctionDeclaration(
        iface: IDLInterface,
        node: IDLMethod,
        converter: BaseTypeConvertor<IDLType>
    ): [string, MethodSignature] {
        const signature = makeSignature(
            node.parameters.map(p => ({
                name: mangleIfKeyword(p.name),
                type: p.type,
                isOptional: p.isOptional
            })),
            converter.convertType(node.returnType)
        )

        if (!isCreateOrUpdate(node.name) && !isImplInterface(iface.name)) {
            signature.args.splice(1, 0, createReferenceType(iface.name))
            signature.argNames!.splice(1, 0, 'receiver')
        }

        const fixArgName = (name: string, prev?: string) =>
            name.endsWith('Len') ? (prev ?? name.slice(0, -3)) + 'SequenceLength' : name === 'ctx' ? 'context' : name
        // Not necessary, just to keep old names
        signature.argNames = signature.argNames
            ?.map((v, i) => fixArgName(v, i === 0 ? undefined : signature.argNames![i - 1]))

        const methodName = isImplInterface(iface.name) ? node.name : InteropConstructions.method(iface.name, node.name)
        return [methodName, signature]
    }

    private printBody(node: IDLMethod, signature: MethodSignature, pandaMethodName: string): void {
        const writer = this.writer
        const argNames = signature.argNames!.map(BridgesConstructions.castedParameter)
        const statements = signature.args.map((type, index) => this.writer.makeAssign(
            BridgesConstructions.castedParameter(signature.argName(index)),
            undefined,
            writer.makeFunctionCall(
                this.castTypeConvertor.convertType(type), [writer.makeString(signature.argName(index))]
            )
        ))

        if (isSequence(node.returnType)) {
            argNames.push(BridgesConstructions.sequenceLengthPass)
            statements.push(makeStatement(writer, BridgesConstructions.sequenceLengthDeclaration))
        }

        const nativeCall = writer.makeFunctionCall(
            pandaMethodName,
            argNames.map(a => writer.makeString(a))
        )

        writer.writeStatements(...statements)

        if (isVoidType(node.returnType)) {
           writer.writeStatements(
               writer.makeStatement(nativeCall),
               writer.makeReturn(writer.makeString(''))
           )
        } else {
           writer.writeStatements(
               writer.makeAssign(BridgesConstructions.result, undefined, nativeCall, true, false),
               writer.makeReturn(this.makeReturnExpression(node))
           )
        }
    }

    private makeReturnExpression(node: IDLMethod): LanguageExpression {
        const makeStringCtor = () => BridgesConstructions.stringConstructor(BridgesConstructions.result)
        const makeSequenceCtor = () => BridgesConstructions.sequenceConstructor(
            BridgesConstructions.result,
            BridgesConstructions.sequenceLengthUsage
        )
        const expr = this.maybeDropConst(node,
            isSequence(node.returnType) ? makeSequenceCtor() :
                isString(node.returnType) ? makeStringCtor() :
                    BridgesConstructions.result
        )

        if (isSequence(node.returnType)) {
            // writer.makeTernary annoys by adding the extra parentheses
            return this.writer.makeString(`${BridgesConstructions.sequenceLengthUsage} ? ${expr} : nullptr`)
        }

        return this.writer.makeString(expr)
    }

    private maybeDropConst(node: IDLMethod, value: string): string {
        if (this.typechecker.isConstReturnValue(node)) {
            return BridgesConstructions.dropConstCast(value)
        }
        return value
    }
}
