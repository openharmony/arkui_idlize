import * as idl from '../idl'
import { Language } from '../Language'
import {
    LanguageWriter,
    NamedMethodSignature,
} from '../LanguageWriters/LanguageWriter'

export class ArrayTypeChecker {

    private knownCheckers = new Set<string>()

    writeMethodsArrayTypeCheckers(decl: idl.IDLInterface, writer: LanguageWriter) {
        if (!this.supportsTypeCheckers(writer.language)) return
        const types = decl.methods
            .flatMap(method => method.parameters.flatMap(param => param.type))
        this.writeArrayTypeCheckers(types, writer)
    }
    writePropertiesArrayTypeCheckers(decl: idl.IDLInterface, writer: LanguageWriter) {
        if (!this.supportsTypeCheckers(writer.language)) return
        const types = decl.properties.map(prop => prop.type)
        this.writeArrayTypeCheckers(types, writer)
    }
    private writeArrayTypeCheckers(types: idl.IDLType[], writer: LanguageWriter) {
        // generates type checkers only for union arrays
        types
            .filter(type => idl.isUnionType(type))
            .map(it => it as idl.IDLUnionType)
            .flatMap(it => it.types)
            .filter(type => idl.IDLContainerUtils.isSequence(type))
            .forEach(type => this.writeArrayTypeChecker(type as idl.IDLContainerType, writer))
    }

    private supportsTypeCheckers(lang: Language) {
        if (lang == Language.ARKTS) return true
        return false
    }

    private writeArrayTypeChecker(type: idl.IDLContainerType, writer: LanguageWriter) {
        const checkerName = writer.getTypeCheckName(type)
        if (this.knownCheckers.has(checkerName)) return
        this.knownCheckers.add(checkerName)
        const sig = new NamedMethodSignature(idl.IDLBooleanType, [type], ["array"])
        writer.writeFunctionImplementation(checkerName,
            sig, writer => {
                const elem = `array[0]`
                const elemType = type.elementType[0]
                // Do not check on "instanceof Array"
                const typeCheck = idl.IDLContainerUtils.isSequence(elemType)
                    ? `${writer.getTypeCheckName(elemType)}(${elem})`
                    : writer.discriminate(elem, 0, elemType, [])
                writer.print(`return array.length == 0 || ${typeCheck}`)
            }
        )
    }

}