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

import {
    IndentedPrinter
} from "@idlizer/core"


function withCompute(index: number, letter: string, compute?: (value: number) => string) {
    let arg = `${letter}${index}`
    return compute ? compute(index) : arg
}

function params(count: number, letter: string, compute?: (value: number) => string): string[] {
    if (count == 0) return []
    let result = [withCompute(0, letter, compute)]
    for (let i = 1; i < count; i++)
        result.push(withCompute(i, letter, compute))
    return result
}

function interopConvType(index: number): string {
    return `InteropTypeConverter<P${index}>::InteropType p${index}`
}

function emitBridge(kind: string, isVoid: boolean, index: number, _: IndentedPrinter) {
    let maybeV = isVoid ? "V" : ""
    let list = (isVoid ? [] : ["Ret"]).concat(params(index, "P"))
    let nameComma = list.length > 0 ? ", " : ""
    _.print(`#define KOALA_INTEROP_DIRECT_${maybeV}${index}(name${nameComma}${list.join(", ")}) \\`)
    _.pushIndent()
    if (kind != "ani") {
        _.print(`KOALA_INTEROP_${maybeV}${index}(name${nameComma}${list.join(", ")})`)
        _.popIndent()
        return
    }
    let returnType = isVoid ? "void" : "InteropTypeConverter<Ret>::InteropType"
    _.print(`inline ${returnType} Ani_##name( \\`)
    _.pushIndent()
    params(index, "p", interopConvType).forEach((value, innerIndex) =>_.print(`${value}${innerIndex < index - 1 ? "," : ""} \\`))
    _.popIndent()
    _.print(`) { \\`)
    _.pushIndent()
    _.print(`KOALA_MAYBE_LOG(name) \\`)
    _.print(`${isVoid ? "": `return DirectInteropTypeConverter<Ret>::convertTo(`}impl_##name(${params(index, "p", (index) => `DirectInteropTypeConverter<P${index}>::convertFrom(p${index})`).join(", ")})${isVoid ? "": ")"}; \\`)
    _.popIndent()
    _.print(`} \\`)
    _.print(`MAKE_ANI_EXPORT(KOALA_INTEROP_MODULE, name, ${(isVoid ? ['"void"'] : ["#Ret"]).concat(params(index, "#P")).join(` "|" `)}, 0)`)
    _.popIndent()
}

export function makeInteropBridges(kind: string): string {
    let _ = new IndentedPrinter()
    let args = kind.split(":")
    if (args.length != 2) throw new Error(`Format is "kind:count"`)
    let count = parseInt(args[1])
    for (let i = 0; i < count; i++)
        emitBridge(args[0], false, i, _)
    for (let i = 0; i < count; i++)
        emitBridge(args[0], true, i, _)
    return _.getOutput().join('\n')
}