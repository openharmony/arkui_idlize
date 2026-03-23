/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import * as core from "@idlizer/core";
import assert from "assert";
import { isContext, isGetter, isRegular, peerMethod } from "../general/common.js";
import { Config } from "../general/Config.js";
import { Typechecker } from "../general/Typechecker.js";
import { ExtraParameter } from "../options/ExtraParameters.js";
import { isSequence, makeMethod } from "../utils/idl.js";

export class CommonGenerator {
    public static resolveProperty(
        property: ExtraParameter,
        iface: core.IDLInterface,
        typechecker: Typechecker
    ): [core.IDLMethod | core.IDLProperty, core.IDLMethod | core.IDLProperty] {
        const parents = typechecker.flatParents(iface)
        const methods = parents.flatMap(p => p.methods)
        const props = parents.flatMap(p => p.properties)
        const getters = methods.filter(isGetter)
        const regulars = methods.filter(isRegular)

        if (property.name === 'modifierFlags') { // Improve: handwritten AstNode property
            const method = core.createProperty(property.name, core.createReferenceType('Es2pandaModifierFlags'))
            return [method, method]
        }

        const removePrefix = (name: string): string => {
            for (const prefix of ["is", "can", "get"]) {
                if (name.startsWith(prefix)) {
                    return name.slice(prefix.length)
                }
            }
            return name
        }

        const getterName = property.getter ?? property.name
        const setterName = property.setter ?? `set${core.capitalize(removePrefix(property.name))}`

        // For now, properties are only synthetically generated in filters and they are uncapitalized.
        const index0 = props.findIndex((value, index) => peerMethod(value.name) === getterName)
        const index1 = getters.findIndex((value, index) => peerMethod(value.name) === getterName)
        const index2 = regulars.findIndex((value, index) => peerMethod(value.name) === setterName)

        assert((index0 >= 0 || index1 >= 0), `Cannot find getter '${getterName}' for parameter ${property.name}!`)
        assert(index2 >= 0, `Cannot find setter '${setterName}' for parameter ${property.name}!`)

        // Improve: validate types of getter and setter
        return [
            index0 >= 0 ? props.at(index0)! : getters.at(index1)!,
            regulars.at(index2)!
        ]
    }

    public static makeExtraParameter(
        param: ExtraParameter,
        iface: core.IDLInterface,
        typechecker: Typechecker
    ): core.IDLParameter {
        const type = (m: core.IDLMethod | core.IDLProperty) => 'type' in m ? m.type : m.returnType
        const [getter, setter] = this.resolveProperty(param, iface, typechecker)

        return core.createParameter(param.name, type(getter), param.optional)
    }

    public static makeExtraParameters(
        iface: core.IDLInterface,
        config: Config,
        typechecker: Typechecker
    ): core.IDLParameter[] {
        return config.parameters.getParameters(iface.name)
            .map(param => this.makeExtraParameter(param, iface, typechecker))
    }

    public static makeExtraStatement(
        prop: ExtraParameter,
        methods: [core.IDLMethod | core.IDLProperty, core.IDLMethod | core.IDLProperty],
        varNames: [string, string],
        writer: core.TSLanguageWriter
    ) : core.LanguageStatement {
        const [getter, setter] = methods
        //console.log(`${prop.name} => ${getter?.name} ${setter?.name}`);

        const str = (n: string) => writer.makeString(n)
        const type = 'parameters' in setter ? setter.parameters.at(0)?.type : undefined
        const isParam = 'optional' in prop

        const [src, dst] = varNames
        const getExpr = str(isParam ? prop.name : `${src}.${peerMethod(getter.name)}`)
        const assignStmt = core.isProperty(setter) ?
            writer.makeAssign(`${dst}.${peerMethod(setter.name)}`, undefined, getExpr, false) :
            writer.makeStatement(
                writer.makeMethodCall(dst, peerMethod(setter.name), type !== undefined ? [getExpr] : [])
            )

        const needCondition = (isParam && prop.optional) || // is optional parameter
            //(type !== undefined && !isOptionalType(type)) || // setter has non-nullable type
            (type === undefined && !core.isProperty(setter)) // setter with no arguments

        return needCondition ? writer.makeCondition(getExpr, writer.makeBlock([assignStmt])) : assignStmt
    }
}
