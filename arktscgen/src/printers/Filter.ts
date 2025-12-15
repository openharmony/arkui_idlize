import * as core from "@idlizer/core";
import { dropSuffix } from "@idlizer/core";
import { isContext } from "../general/common";
import { Config } from "../general/Config";
import { Typechecker } from "../general/Typechecker";
import { isSequence, makeMethod } from "../utils/idl";

export class Filter {
    public static makeMethod(
        name: string,
        returnType: core.IDLType,
        parameters: core.IDLParameter[],
        modifiers: core.MethodModifier[],
        isNullable: (param: core.IDLParameter|core.IDLType) => boolean
    ): core.Method {
        const params = Filter.filterParameters(parameters)
        return makeMethod(
            name,
            params.map(p => ({
                name: p.name,
                type: this.makeOptionalType(p, isNullable),
                isOptional: p.isOptional
            })),
            this.makeOptionalType(returnType, isNullable),
            modifiers
        );
    }

    public static makeOptionalType(
        param: core.IDLParameter|core.IDLType,
        isNullable: (param: core.IDLParameter|core.IDLType) => boolean
    ): core.IDLType {
        const type = core.isParameter(param) ? param.type : param
        return isNullable(param) ? core.createOptionalType(type) : type
    }

    public static isNullableType(type: core.IDLType, typechecker: Typechecker): boolean {
        return core.isReferenceType(type) &&
            (typechecker.isPeer(type) || type.name === Config.astNodeCommonAncestor)
    }

    public static filterMoreSpecific(methods: core.IDLMethod[]): core.IDLMethod[] {
        const ifaceName = methods.length && methods[0].parent && core.isInterface(methods[0].parent) ?  methods[0].parent.name : ''
        const compat = ['ETSTuple', 'ExportNamedDeclaration']

        const noCopyCtor = methods
            .filter(m => !(m.parameters.length === 2 && isContext(m.parameters[0]) && m.parameters[1].name === 'other'))

        if (compat.includes(ifaceName)) {
            return methods
        }

        // This is a simplified algo of UniversalCreateTransformer
        return noCopyCtor.length ?  [
            noCopyCtor.reduce((prev, curr) =>
                curr.parameters.length > prev.parameters.length ? curr : prev,
                noCopyCtor[0]
            )
        ] : noCopyCtor
    }

    public static filterParameters(params: core.IDLParameter[]): core.IDLParameter[] {
        return Filter.removeArrayLengthParam(Filter.removeContextParam(params))
    }

    public static filterMethods(methods: core.IDLMethod[]): core.IDLMethod[] {
        const names = new Set<string>(methods.map(m => m.name))
        const others = methods
            .filter(method => {
                const bareName = dropSuffix(
                    dropSuffix(method.name, Config.constPostfix), Config.ptrPostfix
                )
                // no suffix -> ptr -> const
                return bareName === method.name ||
                    (method.name.endsWith(Config.ptrPostfix) && !names.has(bareName)) ||
                    (method.name.endsWith(Config.constPostfix) &&
                        !names.has(bareName) && !names.has(`${bareName}${Config.ptrPostfix}`))
            })
        return others
    }

    public static isOptional(param: core.IDLParameter, typechecker: Typechecker): boolean {
        return core.isReferenceType(param.type) &&
            (typechecker.isPeer(param.type) || param.type.name === Config.astNodeCommonAncestor)
    }

    public static isArrayLengthParam(param: core.IDLParameter): boolean {
        return core.isPrimitiveType(param.type) &&
            ['u32', 'i32', 'u64', 'i64'].includes(param.type.name) &&
            ['Len', 'Count', 'Num', 'argc'].some(m => param.name.endsWith(m))
    }

    public static findArrayLengthParam(parameters: readonly core.IDLParameter[], startIndex: number = 0): number {
        let seqInd = parameters.findIndex((p, index) => index >= startIndex && isSequence(p.type))
        while (seqInd !== -1) {
            if (seqInd > 0 && this.isArrayLengthParam(parameters[seqInd - 1])) {
                return seqInd - 1
            }
            if (seqInd + 1 < parameters.length && this.isArrayLengthParam(parameters[seqInd + 1])) {
                return seqInd + 1
            }
            seqInd = parameters.findIndex((p, index) => index >= (startIndex + seqInd + 1) && isSequence(p.type))

        }
        return -1;
    }

    public static removeArrayLengthParam(parameters: readonly core.IDLParameter[]): core.IDLParameter[] {
        const params = [...parameters]
        let index = this.findArrayLengthParam(params)
        while (index !== -1) {
            params.splice(index, 1)
            index = this.findArrayLengthParam(params, index)
        }
        return params
    }

    public static removeContextParam(parameters: readonly core.IDLParameter[]): core.IDLParameter[] {
        const first = parameters.at(0)
        return first && isContext(first) ? parameters.slice(1) : [...parameters]
    }
}
