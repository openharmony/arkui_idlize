import { ArgConvertor } from "./peer-generation/Convertors"
import { TypeNodeConvertor } from "./peer-generation/TypeNodeConvertor"
import { Language } from "./util"

export interface DeclarationProcessor<T1, T2> {
    language: Language
    readonly typeMap: Map<T1, [T2, string[], boolean]>
    orderedDependencies: T2[]
    typeConvertor(paramName: string, 
        type: T1, 
        isOptional?: boolean, 
        maybeCallback?: boolean,
        nodeConv?: TypeNodeConvertor<string>
    ): ArgConvertor
    declarationConvertor(paramName: string, 
        type: T1, 
        declaration?: T2,
        maybeCallback?: boolean,
        nodeConv?: TypeNodeConvertor<string>
    ): ArgConvertor
    getTypeName(type: T1, optional?: boolean): string
    toDeclaration(node: T1): T2 // or toTarget(node: T1): T2
    computeTargetName(target: T2, optional: boolean): string
    requestType(type: T1, useToGenerate: boolean, name: string): void


    // typeChecker: ts.TypeChecker | undefined
    // computeTypeName(suggestedName: string | undefined, type: ts.TypeNode, optional?: boolean, prefix?: string): string
    // serializerName(name: string): string
    // deserializerName(name: string): string
    // targetStruct(target: DeclarationTarget): StructDescriptor
}