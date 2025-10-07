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

import * as fs from "fs"
import * as idl from "../idl"
import { DiagnosticException, DiagnosticMessage, Location, MessageSeverityList, Position } from "../diagnostictypes"
import { DiagnosticMessageGroup, LoadingFatal, InternalFatal } from "../diagnosticmessages"

const DeprecatedTypeArguments = new DiagnosticMessageGroup("warning", "DeprecatedTypeArguments", "TypeArguments is deprecated", "TypeArguments extended attribute is deprecated")
const DeprecatedTypeParameters = new DiagnosticMessageGroup("warning", "DeprecatedTypeParameters", "TypeParameters is deprecated", "TypeParameters extended attribute is deprecated")
const DuplicateModifier = new DiagnosticMessageGroup("error", "DuplicateModifier", "Duplicate modifier", "Duplicate of")
const NotApplicableModifier = new DiagnosticMessageGroup("error", "NotApplicableModifier", "Not applicable modifier")
const DuplicatePackageDeclaration = new DiagnosticMessageGroup("error", "DuplicatePackageDeclaration", "Duplicate package declaration", "Duplicate of")
const DuplicateExtendedAttribute = new DiagnosticMessageGroup("error", "DuplicateExtendedAttribute", "Duplicate extended attribute", "Duplicate of")
const DuplicateArgumentName = new DiagnosticMessageGroup("error", "DuplicateArgumentName", "Duplicate argument name", "Duplicate of")
const IncorrectLiteral = new DiagnosticMessageGroup("error", "IncorrectLiteral", "Incorrect literal")
const IncorrectIdentifier = new DiagnosticMessageGroup("error", "IncorrectIdentifier", "Incorrect identifier")
const UnexpectedToken = new DiagnosticMessageGroup("error", "UnexpectedToken", "Unexpected token")
const UnexpectedEndOfFile = new DiagnosticMessageGroup("fatal", "UnexpectedEndOfFile", "Unexpected end of file")
const UnrecognizedSymbols = new DiagnosticMessageGroup("fatal", "UnrecognizedSymbols", "Unrecognized symbols")
const UnsupportedSyntax = new DiagnosticMessageGroup("error", "UnsupportedSyntax", "Unsupported syntax")
const WrongDeclarationPlacement = new DiagnosticMessageGroup("error", "WrongDeclarationPlacement", "Wrong declaration placement")
const ExpectedPrimitiveType = new DiagnosticMessageGroup("error", "ExpectedPrimitiveType", "Expected primitive type")
const ExpectedReferenceType = new DiagnosticMessageGroup("error", "ExpectedReferenceType", "Expected reference type")
const ExpectedGenericArguments = new DiagnosticMessageGroup("error", "ExpectedGenericArguments", "Expected generic arguments")
const UnexpectedGenericArguments = new DiagnosticMessageGroup("error", "UnexpectedGenericArguments", "Unexpected generic arguments")
const InlineParsingDepthExceeded = new DiagnosticMessageGroup("fatal", "InlineParsingDepthExceeded", "Inline parsing depth exceeded")

export class FatalParserException extends Error {
    diagnosticMessages?: DiagnosticMessage[]
    constructor(diagnosticMessages?: DiagnosticMessage[]) {
        super()
        this.diagnosticMessages = diagnosticMessages
    }
}

enum TokenKind {
    Words,
    Literal,
    Symbol,
    Comment,
    Whitespace,
    End
}

interface Token {
    kind: TokenKind
    value: string
    location: Location
}
const supportedDeclarations = new Set<string>(["attribute", "callback", "const", "constructor", "dictionary",
    "enum", "import", "interface", "namespace", "package", "typedef", "version"])

const unsupportedDeclarations = new Set<string>(["deleter", "getter", "includes", "inherit", "iterable", "maplike",
    "mixin", "partial", "required", "setlike", "setter", "stringifier", "unrestricted"])

const interfaceContent = new Set<idl.IDLKind>([idl.IDLKind.Constructor, idl.IDLKind.Const, idl.IDLKind.Property, idl.IDLKind.Method, idl.IDLKind.Callable])

const globalContent = new Set<idl.IDLKind>([idl.IDLKind.Namespace, idl.IDLKind.Interface, idl.IDLKind.Enum, idl.IDLKind.Method, idl.IDLKind.Typedef, idl.IDLKind.Callback, idl.IDLKind.Import, idl.IDLKind.Version, idl.IDLKind.Const])

const havingBlocks = new Set<idl.IDLKind>([idl.IDLKind.Namespace, idl.IDLKind.Interface, idl.IDLKind.Enum])

type ModifierToken = "static" | "readonly" | "async"
type ModifiersContainer = {[Key in ModifierToken]?: Token}
const modifierTokens = new Set<ModifierToken>(["static", "readonly", "async"])

// Uncomment in case of parser debugging
function trac(s: string) {
    // console.log(s)
}

export class Parser {
    fileName: string
    content: string
    lines: string[]
    offsets: number[]

    constructor(fileName: string, content?: string) {
        trac("constructor")
        this.fileName = fileName
        if (undefined === content) {
            try {
                content = fs.readFileSync(fileName).toString()
            } catch (e: any) {
                content = ""
                throw new FatalParserException([LoadingFatal.reportDiagnosticMessage([{documentPath: fileName}], e.message ?? "")])
            }
        }
        this.content = content
        const lines = content.match(/[^\r\n]*(\n|\r\n)?/g) as string[] ?? []
        this.offsets = prepareOffsets(lines)
        this.lines = lines.map((s) => s.replace(/(\n|\r\n)$/, ""))
    }

    parseIDL<T>(parser: () => T): T {
        const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
        try {
            this._lexerNext()
            this._prevToken = this._curToken
            let result = parser()
            if (DiagnosticMessageGroup.allGroupsEntries.length != previousDiagnosticsCount) {
                if (DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount).some(msg => MessageSeverityList.indexOf(msg.severity) <= MessageSeverityList.indexOf('error'))) {
                    // Empty for now, messages will be added in following `catch`.
                    throw new FatalParserException()
                }
            }
            return result
        } catch (e) {
            if (!(e instanceof DiagnosticException) && !(e instanceof FatalParserException)) {
                InternalFatal.reportDiagnosticMessage([{documentPath: this.fileName}], (e as any).message ?? "")
            }
            throw new FatalParserException(DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount))
        }
    }

    parseIDLFile(): idl.IDLFile {
        trac("parseIDLFile")
        return this.parseIDL(() => {
            const file = this.parseFile()
            file.text = this.content
            return file
        })
    }

    parseIDLType(): idl.IDLType {
        trac("parseIDLType")
        return this.parseIDL(() => this.parseType())
    }

    parseIDLTypeList(): idl.IDLType[] {
        trac("parseIDLTypeList")
        return this.parseIDL(() => this.parseTypeList())
    }

    _curOffset: number = 0
    _curLine: number = 0
    _curToken!: Token
    _prevToken!: Token

    // TypeParameters support
    _generics: string[][] = []

    // TypeArguments parsing support
    _inLiteralParsingLevel: number = 0

    _match(re: RegExp, kind: TokenKind): Token | undefined {
        re.lastIndex = this._curOffset
        const res = re.exec(this.content)
        if (!res) {
            return undefined
        }
        const value = res[0]
        const startLine = this._curLine + 1
        const startCharacter = this._curOffset - this.offsets[this._curLine] + 1
        this._curOffset = re.lastIndex
        this._curLine += (value.match(/\n/g)||[]).length
        const endLine = this._curLine + 1
        const endCharacter = this._curOffset - this.offsets[this._curLine]
        const location = {documentPath: this.fileName, lines: this.lines, range: {start: {line: startLine, character: startCharacter}, end: {line: endLine, character: endCharacter}}}
        this._curToken = {kind, value, location}
        return this._curToken
    }

    // symTokens = ["(", ")", "[", "]", "{", "}", ",", "...", ":", ";", "<", "=", ">", "?"]

    _reDecimal = /-?(?=[0-9]*\.|[0-9]+[eE])(([0-9]+\.[0-9]*|[0-9]*\.[0-9]+)([Ee][-+]?[0-9]+)?|[0-9]+[Ee][-+]?[0-9]+)/y
    _reInteger = /-?(0([Xx][0-9A-Fa-f]+|[0-7]*)|[1-9][0-9]*)/y
    _reString = /"[^"]*"/y
    // -something is handled for -Infinity literal parsing, but rejected for identifiers later
    _reWords = /[-]?[_$A-Za-z][_$0-9A-Za-z]*([.][_$A-Za-z][_$0-9A-Za-z]*)*/y
    _reSymbol = /\.\.\.|[()[\]{},:;<=>?]/y
    _reWhitespace = /[\t\n\r ]+/y
    _reComment = /\/\/.*|\/\*[\s\S]*?\*\//y

    // Note no sticky behavior.
    _reIsDocComment = /\/\/\/.*|\/\*\*[\s\S]*?\*\//

    _matchComment(): Token | undefined {
        const token = this._match(this._reComment, TokenKind.Comment)
        // At any parsing moment `precedingComment` represents possible comment token just before`curToken`.
        // It can be narrowed by `_reIsDocComment` if needed.
        if (token) {
            this.precedingComment = token
        }
        return token
    }

    _lexerNext(): void {
        trac("_advance")
        this._prevToken = this._curToken
        this._match(this._reWhitespace, TokenKind.Whitespace)
        this.precedingComment = undefined
        while(this._matchComment()) {
            this._match(this._reWhitespace, TokenKind.Whitespace)
        }
        if (this._curOffset == this.content.length) {
            const pos: Position = {line: this._curLine + 1, character: this._curOffset - this.offsets[this._curLine] + 1}
            this._curToken = {kind: TokenKind.End, value: "", location: {documentPath: this.fileName, lines: this.lines, range: {start: pos, end: pos}}}
            return
        }
        if (this._inLiteralParsingLevel && (this.content[this._curOffset] == "\"" || this.content[this._curOffset] == "'")) {
            // TypeArguments parsing support
            const pos: Position = {line: this._curLine + 1, character: this._curOffset - this.offsets[this._curLine] + 1}
            this._curToken = {kind: TokenKind.Symbol, value: this.content[this._curOffset], location: {documentPath: this.fileName, lines: this.lines, range: {start: pos, end: pos}}}
            this._curOffset += 1
            return
        }
        const token = (
            this._match(this._reDecimal, TokenKind.Literal) ??
            this._match(this._reInteger, TokenKind.Literal) ??
            this._match(this._reString, TokenKind.Literal) ??
            this._match(this._reWords, TokenKind.Words) ??
            this._match(this._reSymbol, TokenKind.Symbol)
        )
        if (!token) {
            const pos: Position = {line: this._curLine + 1, character: this._curOffset - this.offsets[this._curLine] + 1}
            UnrecognizedSymbols.throwDiagnosticMessage([{documentPath: this.fileName, lines: this.lines, range: {start: pos, end: pos}}])
        }
        // Uncomment in case of parser debugging
        // if (token) {
        //     const visTok = {...token, location: {...token.location, lines: undefined, documentPath: undefined}}
        //     console.log(`Token: ${JSON.stringify(visTok)}`)
        // }
    }

    get curToken(): Token {
        return this._curToken
    }

    get curKind(): TokenKind {
        return this._curToken.kind
    }

    get curValue(): string {
        return this._curToken.value
    }

    get curLocation(): Location {
        return this.curToken.location
    }

    see(tok: string): boolean {
        return this.curValue == tok
    }

    seeAndSkip(tok: string): boolean {
        if (this.curValue == tok) {
            this._lexerNext()
            return true
        }
        return false
    }

    seeEof(): boolean {
        return this.curToken.kind == TokenKind.End
    }

    skip(tok: string) {
        if (this.curValue != tok) {
            if (this.curKind == TokenKind.End) {
                UnexpectedEndOfFile.throwDiagnosticMessage([this.curLocation], `Unexpected end of file, expected "${tok}"`)
            }
            UnexpectedToken.throwDiagnosticMessage([this.curLocation], `Unexpected token, expected "${tok}"`)
        }
        this._lexerNext()
    }

    skipToAfter(tok: string) {
        trac("skipToAfter")
        while (!this.see(tok) && !this.seeEof()) {
            this._lexerNext()
        }
        if (!this.seeEof()) {
            this._lexerNext()
        }
    }

    trackLocation(): () => Location {
        trac("trackLocation")
        const start = this.curLocation
        return () => {
            const end = this._prevToken.location
            return {
                documentPath: this.fileName,
                range: { start: start.range!.start, end: end.range!.end },
                lines: this.lines
            }
        }
    }

    _internalCurrentExtended: idl.IDLExtendedAttribute[] | undefined

    consumeCurrentExtended(): idl.IDLExtendedAttribute[] | undefined {
        const ext = this._internalCurrentExtended
        this._internalCurrentExtended = undefined
        return ext
    }

    currentModifiers: ModifiersContainer = {}

    assertPossibleModifiers(...mods: ModifierToken[]): void {
        for (const k of Object.keys(this.currentModifiers) as ModifierToken[]) {
            if (!mods.includes(k)) {
                NotApplicableModifier.reportDiagnosticMessage([this.currentModifiers[k]!.location])
            }
        }
    }

    precedingComment: Token | undefined
    currentPackage: string | undefined

    parseSingleIdentifier(): Token {
        trac("parseSingleIdentifier")
        const token = this.parseFullIdentifier()
        if (token.value.includes(".")) {
            IncorrectIdentifier.throwDiagnosticMessage([this.curLocation])
        }
        return token
    }

    parseFullIdentifier(): Token {
        trac("parseFullIdentifier")
        if (this.curKind != TokenKind.Words || literalTypes.has(this.curValue) && this.curValue != "undefined") {
            UnexpectedToken.throwDiagnosticMessage([this.curLocation], "Unexpected token, expected identifier")
        }
        if (this.curValue.startsWith("-")) {
            // Valid for identifiers in WebIDL, but not in Idlize
            IncorrectIdentifier.throwDiagnosticMessage([this.curLocation])
        }
        const token = this.curToken
        this._lexerNext()
        return token
    }

    parseFullIdentifierOrLiteral(): Token {
        trac("parseFullIdentifierOrLiteral")
        if (this.curKind != TokenKind.Words && this.curKind != TokenKind.Literal) {
            UnexpectedToken.throwDiagnosticMessage([this.curLocation], "Unexpected token, expected identifier or literal")
        }
        const token = this.curToken
        this._lexerNext()
        return token
    }

    parseLiteral(): Token {
        trac("parseLiteral")
        if (this.curKind != TokenKind.Literal && !literalTypes.has(this.curValue)) {
            UnexpectedToken.throwDiagnosticMessage([this.curLocation], "Unexpected token, expected literal")
        }
        const token = this.curToken
        this._lexerNext()
        return token
    }

    parseAndPushGenerics(ext: idl.IDLExtendedAttribute[] | undefined): string[] | undefined {
        const gen = extractTypeParameters(ext) ?? []
        const found = ext?.find(e => e.name === LEGACY_TYPE_PARAMETERS_ATTRIBUTE)
        if (found && found.nameLocation) {
            DeprecatedTypeParameters.reportDiagnosticMessage([found.nameLocation], 'TypeParameters attribute is deprecated, use "<..>" syntax');
            ext?.splice(ext.indexOf(found), 1)
        }
        if (this.seeAndSkip("<")) {
            let next = false
            while (!this.seeAndSkip(">")) {
                if (next) {
                    this.skip(",")
                }
                next = true
                gen.push(this.parseSingleIdentifier().value)
            }
        }
        // To be restored in parseDeclaration
        this._generics.push(gen)
        return gen.length === 0 ? undefined : gen
    }

    hasGeneric(name: string): boolean {
        return this._generics.some(x => x.includes(name))
    }

    parseFile(): idl.IDLFile {
        trac("parseFile")
        const entries: idl.IDLEntry[] = []
        while (!this.seeEof()) {
            const entry = this.parseDeclaration(idl.IDLKind.File)
            if (entry) {
                entries.push(entry)
            }
        }
        return idl.createFile(entries, this.fileName, this.currentPackage?.split("."), {nodeLocation: {documentPath: this.fileName, lines: this.lines}})
    }

    parseDeclaration(scopeKind: idl.IDLKind): idl.IDLEntry | undefined {
        trac("parseDeclaration")
        const genericsLevel = this._generics.length
        try {
            const decl = this.parseDeclarationUnsafe(scopeKind)
            if (!decl) {
                return
            }
            if (scopeKind == idl.IDLKind.Interface ? !interfaceContent.has(decl.kind) : !globalContent.has(decl.kind)) {
                // Prefer shorter location ranges for blocks for now
                const location = havingBlocks.has(decl.kind) ? decl.nameLocation : decl.nodeLocation
                WrongDeclarationPlacement.reportDiagnosticMessage([location!], `Wrong declaration placement: ${decl.kind} not allowed in ${scopeKind}`)
            }
            return decl
        } catch (e) {
            if (e instanceof DiagnosticException && e.diagnosticMessage.severity != "fatal") {
                this.skipToAfter(";")
                return
            }
            throw e
        }
        finally {
            while (this._generics.length > genericsLevel) {
                this._generics.pop()
            }
        }
    }

    parseDeclarationUnsafe(scopeKind: idl.IDLKind): idl.IDLEntry | undefined {
        trac("parseDeclarationUnsafe")
        this._internalCurrentExtended = this.parseExtendedAttributes()
        this.currentModifiers = {}
        while (modifierTokens.has(this.curValue as ModifierToken)) {
            if (this.currentModifiers[this.curValue as ModifierToken]) {
                DuplicateModifier.reportDiagnosticMessage([this.curLocation])
            }
            this.currentModifiers[this.curValue as ModifierToken] = this.curToken
            this._lexerNext()
        }
        if (unsupportedDeclarations.has(this.curValue)) {
            UnsupportedSyntax.throwDiagnosticMessage([this.curLocation])
            return
        }
        if (supportedDeclarations.has(this.curValue)) {
            if (this.curValue != "attribute") {
                this.assertPossibleModifiers()
            }
            switch (this.curValue) {
                case "attribute":
                    this.assertPossibleModifiers("static", "readonly")
                    return this.parseAttribute()
                case "callback":
                    return this.parseCallback()
                case "const":
                    return this.parseConst()
                case "constructor":
                    return this.parseConstructor()
                case "dictionary":
                    return this.parseDictionary()
                case "enum":
                    return this.parseEnum()
                case "import":
                    return this.parseImport()
                case "interface":
                    return this.parseInterface()
                case "namespace":
                    return this.parseNamespace()
                case "package":
                    {
                        const pack = this.parsePackage()
                        if (this.currentPackage) {
                            DuplicatePackageDeclaration.reportDiagnosticMessage([pack.location])
                        }
                        this.currentPackage = pack.name
                        if (scopeKind != idl.IDLKind.File) {
                            WrongDeclarationPlacement.reportDiagnosticMessage([pack.location], `Wrong declaration placement: package is not allowed in ${scopeKind}`)
                        }
                        return
                    }
                case "typedef":
                    return this.parseTypedef()
                case "version":
                    return this.parseVersion()
            }
        } else {
            this.assertPossibleModifiers("static", "async")
            return this.parseOperation()
        }
    }

    parseNamespace(): idl.IDLNamespace {
        trac("parseNamespace")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("namespace")
        const name = this.parseSingleIdentifier()
        const entries: idl.IDLEntry[] = []
        this.skip("{")
        while(!this.seeAndSkip("}")) {
            const entry = this.parseDeclaration(idl.IDLKind.Namespace)
            if (entry) {
                entries.push(entry)
            }
        }
        this.skip(";")
        return idl.createNamespace(name.value, entries, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location})
    }

    parseInterface(): idl.IDLInterface {
        trac("parseInterface")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("interface")
        const typeParameters = this.parseAndPushGenerics(ext)
        const name = this.parseSingleIdentifier()
        let bases: idl.IDLReferenceType[] = []
        if (this.seeAndSkip(":")) {
            const typeList = this.parseTypeList()
            for (const type of typeList) {
                if (idl.isReferenceType(type)) {
                    bases.push(type)
                } else {
                    ExpectedReferenceType.reportDiagnosticMessage([type.nodeLocation!])
                }
            }
        }
        const entries: idl.IDLEntry[] = []
        this.skip("{")
        while(!this.seeAndSkip("}")) {
            const entry = this.parseDeclaration(idl.IDLKind.Interface)
            if (entry) {
                if (idl.isMethod(entry)) {
                    entry.isFree = false
                }
                entries.push(entry)
            }
        }
        this.skip(";")
        return idl.createInterface(name.value, extractInterfaceSubkind(ext), bases,
            entries.filter(idl.isConstructor),
            entries.filter(idl.isConstant),
            entries.filter(idl.isProperty),
            entries.filter(idl.isMethod),
            entries.filter(idl.isCallable),
            typeParameters,
            {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location}
        )
    }

    parseExtendedAttributes(): idl.IDLExtendedAttribute[] | undefined {
        trac("parseExtendedAttributes")
        // For future extensions: here is also a good point for doc comments handling
        if (!this.seeAndSkip("[")) {
            return
        }
        const ext: idl.IDLExtendedAttribute[] = []
        const names = new Set<string>()
        const duplicates = new Set<string>()
        let next = false
        while (!this.seeAndSkip("]")) {
            if (next) {
                this.skip(",")
            }
            next = true
            const name = this.parseSingleIdentifier()
            if (names.has(name.value)) {
                duplicates.add(name.value)
            }
            names.add(name.value)
            if (name.value === LEGACY_TYPE_ARGUMENTS_ATTRIBUTE || name.value === idl.IDLExtendedAttributes.TypeParametersDefaults) {
                // TypeArguments parsing support
                try {
                    this._inLiteralParsingLevel += 1
                    if (this._inLiteralParsingLevel > 2) {
                        InlineParsingDepthExceeded.throwDiagnosticMessage([this.curLocation])
                    }
                    this.skip("=")
                    const vloc = this.trackLocation()
                    const start = this._curOffset // Already after first quote
                    this.skip(this._inLiteralParsingLevel == 2 ? "'" : "\"")
                    const types = this.parseTypeList()
                    const end = this._curOffset - 1 // Already after second quote
                    this._inLiteralParsingLevel -= 1
                    // Note that second this._inLiteralParsingLevel comparison happens after decrement
                    this.skip(this._inLiteralParsingLevel == 1 ? "'" : "\"")
                    const stringValue = this.content.slice(start, end)
                    ext.push({name: name.value, value: stringValue, typesValue: types, nameLocation: name.location, valueLocation: vloc()})
                } catch (e) {
                    if (e instanceof DiagnosticException && e.diagnosticMessage.severity != "fatal") {
                        this.skipToAfter("\"")
                    }
                    this._inLiteralParsingLevel = 0
                    throw e
                }
            } else {
                let value: Token | undefined
                if (this.seeAndSkip("=")) {
                    value = this.parseFullIdentifierOrLiteral()
                }
                const converted = value ? valueFromIdentifierOrLiteral(value) : undefined
                ext.push({name: name.value, value: converted, nameLocation: name.location, valueLocation: value?.location})
            }
        }
        for (const dup of duplicates) {
            DuplicateExtendedAttribute.reportDiagnosticMessage(ext.filter(x => x.name == dup).map(x => x.nameLocation!))
        }
        return ext
    }

    parseTypeList(): idl.IDLType[] {
        trac("parseTypeList")
        const types = [this.parseType()]
        while (this.seeAndSkip(",")) {
            types.push(this.parseType())
        }
        return types
    }

    parseType(outerExt?: idl.IDLExtendedAttribute[]): idl.IDLType {
        // Tuned for IDLize types, no support for legacy combinations like "unsigned short"
        trac("parseType")
        const parsedExt = this.parseExtendedAttributes()
        const ext = parsedExt ? (outerExt ? parsedExt.concat(outerExt) : parsedExt) : (outerExt ? [...outerExt] : undefined)
        const sloc = this.trackLocation()
        if (this.seeAndSkip("(")) {
            let combinedTypes: idl.IDLType[] = []
            let next = false
            while (!this.seeAndSkip(")")) {
                if (next) {
                    this.skip("or")
                }
                next = true
                combinedTypes.push(this.parseType())
            }
            const isNullable = this.seeAndSkip("?") || combinedTypes.includes(idl.IDLUndefinedType)
            combinedTypes = combinedTypes.filter(x => x !== idl.IDLUndefinedType)
            const distilledType = combinedTypes.length == 1
                ? combinedTypes[0]
                : idl.createUnionType(combinedTypes, undefined, {extendedAttributes: ext, nodeLocation: sloc()})
            if (isNullable) {
                return idl.createOptionalType(distilledType, {extendedAttributes: ext, nodeLocation: sloc()})
            }
            return distilledType
        }
        const name = this.parseFullIdentifier()
        const genArgs = extractTypeArguments(ext) ?? []
        const foundArgAttr = ext?.find(it => it.name === LEGACY_TYPE_ARGUMENTS_ATTRIBUTE)
        if (foundArgAttr && foundArgAttr.nameLocation) {
            DeprecatedTypeArguments.reportDiagnosticMessage([foundArgAttr.nameLocation], 'TypeArgument is deprecated extended attribute, use "<..>" syntax')
            ext?.splice(ext.indexOf(foundArgAttr), 1)
        }
        if (this.seeAndSkip("<")) {
            let next = false
            while (!this.seeAndSkip(">")) {
                if (next) {
                    this.skip(",")
                }
                next = true
                genArgs.push(this.parseType())
            }
        }
        let type: idl.IDLType
        if (this.hasGeneric(name.value)) {
            if (genArgs.length > 0) {
                UnexpectedGenericArguments.reportDiagnosticMessage([name.location])
            }
            type = idl.createTypeParameterReference(name.value, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location})
        } else if (builtinTypes.has(name.value)) {
            if (genArgs.length > 0) {
                UnexpectedGenericArguments.reportDiagnosticMessage([name.location])
            }
            type = builtinTypes.get(name.value)!
        } else if (builtinGenericTypeNames.has(name.value)) {
            if (genArgs.length == 0) {
                ExpectedGenericArguments.reportDiagnosticMessage([name.location])
            }
            type = idl.createContainerType(name.value as idl.IDLContainerKind, genArgs, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location})
        } else {
            type = idl.createReferenceType(name.value, genArgs.length > 0 ? genArgs : undefined, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location})
        }
        const isNullable = this.seeAndSkip("?")
        if (isNullable) {
            return idl.createOptionalType(type, {extendedAttributes: ext, nodeLocation: sloc()})
        } else {
            return type
        }
    }

    parseReferenceType(): idl.IDLReferenceType {
        trac("parseReferenceType")
        const type = this.parseType()
        if (!idl.isReferenceType(type)) {
            ExpectedReferenceType.reportDiagnosticMessage([type.nodeLocation!])
        }
        return type as idl.IDLReferenceType
    }

    parsePrimitiveType(): idl.IDLPrimitiveType {
        trac("parsePrimitiveType")
        const type = this.parseType()
        if (!idl.isPrimitiveType(type)) {
            ExpectedPrimitiveType.reportDiagnosticMessage([type.nodeLocation!])
        }
        return type as idl.IDLPrimitiveType
    }

    parseArgTuple(): idl.IDLParameter[] {
        trac("parseArgTuple")
        const args: idl.IDLParameter[] = []
        const names = new Set<string>()
        const duplicates = new Set<string>()
        this.skip("(")
        let next = false
        while (!this.seeAndSkip(")")) {
            if (next) {
                this.skip(",")
            }
            next = true
            const arg = this.parseArg()
            if (names.has(arg.name)) {
                duplicates.add(arg.name)
            }
            names.add(arg.name)
            args.push(arg)
        }
        for (const dup of duplicates) {
            DuplicateArgumentName.reportDiagnosticMessage(args.filter(x => x.name == dup).map(x => x.nameLocation!))
        }
        return args
    }

    parseArg(): idl.IDLParameter {
        trac("parseArg")
        const ext = this.parseExtendedAttributes()
        const sloc = this.trackLocation()
        const optional = this.seeAndSkip("optional")
        // Note `extendedAttributes` forwarding
        const type = this.parseType(ext)
        const spread = this.seeAndSkip("...")
        const name = this.parseSingleIdentifier()
        // Note absense of `extendedAttributes`, they are only forwarded to `type`, as it was in the old parsing code
        return idl.createParameter(name.value, type, optional, spread, {nodeLocation: sloc(), nameLocation: name.location})
    }

    parseOperation(): idl.IDLCallable | idl.IDLMethod {
        trac("parseOperation")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        const isStatic = !!this.currentModifiers.static
        const isAsync = !!this.currentModifiers.async
        const isOptional = extractOptional(ext)
        const isFree = true // Will be set to false in parseInterface if method is declared within interface
        const typeParameters = this.parseAndPushGenerics(ext)
        // Note `extendedAttributes` forwarding
        const retType = this.parseType(ext)
        const name = this.parseSingleIdentifier()
        const args = this.parseArgTuple();
        this.skip(";")
        if (ext?.some(x => x.name == idl.IDLExtendedAttributes.CallSignature)) {
            return idl.createCallable(name.value, args, retType, {isStatic, isAsync}, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location}, typeParameters)
        }
        return idl.createMethod(name.value, args, retType, {isStatic, isAsync, isOptional, isFree}, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location}, typeParameters)
    }
    
    parseConstructor(): idl.IDLConstructor {
        trac("parseConstructor")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("constructor")
        const args = this.parseArgTuple();
        this.skip(";")
        return idl.createConstructor(args, undefined, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc()})
    }

    parseConst(): idl.IDLConstant {
        trac("parseConst")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("const")
        const type = this.parseType()
        const name = this.parseSingleIdentifier()
        let value: Token | undefined;
        if (this.seeAndSkip("=")) {
            value = this.parseLiteral()
        }
        this.skip(";")
        // Note that raw value (with quoted strings) is used here, that provides compatibility with older code (while being different from `dictionary` processing)
        return idl.createConstant(name.value, type, value?.value, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location, valueLocation: value?.location})
    }

    parseAttribute(): idl.IDLProperty {
        trac("parseAttribute")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        const isReadonly = !!this.currentModifiers.readonly
        const isStatic = !!this.currentModifiers.static
        const isOptional = extractOptional(ext)
        this.skip("attribute")
        const type = this.parseType()
        const name = this.parseSingleIdentifier()
        this.skip(";")
        return idl.createProperty(name.value, type, isReadonly, isStatic, isOptional, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location})
    }

    parseTypedef() {
        trac("parseTypedef")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("typedef")
        const typeParameters = this.parseAndPushGenerics(ext)
        const type = this.parseType()
        const name = this.parseSingleIdentifier()
        if (idl.isUnionType(type)) {
            type.name = name.value
            type.extendedAttributes = ext
        }
        this.skip(";")
        return idl.createTypedef(name.value, type, typeParameters, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location})
    }

    parseCallback(): idl.IDLCallback {
        trac("parseCallback")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("callback")
        if (this.see("interface")) {
            UnsupportedSyntax.throwDiagnosticMessage([this.curLocation], "Unsupported syntax: callback interface")
        }
        const typeParameters = this.parseAndPushGenerics(ext)
        const name = this.parseSingleIdentifier()
        this.skip("=")
        const retType = this.parseType()
        const args = this.parseArgTuple()
        this.skip(";")
        return idl.createCallback(name.value, args, retType, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location}, typeParameters)
    }

    parseEnum() {
        trac("parseEnum")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("enum")
        const name = this.parseSingleIdentifier()
        const items: idl.IDLEnumMember[] = []
        this.skip("{")
        let next = false
        while (!this.seeAndSkip("}")) {
            if (next) {
                this.skip(",")
                // Can have trailing comma
                if (this.seeAndSkip("}")) {
                    break
                }
            }
            next = true
            const ext = this.parseExtendedAttributes()
            const entry = this.parseLiteral()
            const member = idl.createEnumMember(entry.value, undefined as any, idl.IDLNumberType, undefined, {extendedAttributes: ext, nodeLocation: entry.location, nameLocation: entry.location})
            items.push(member)
        }
        return idl.createEnum(name.value, items, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location})
    }

    parseDictionary(): idl.IDLEnum {
        trac("parseDictionary")
        const sloc = this.trackLocation()
        const ext = this.consumeCurrentExtended()
        this.skip("dictionary")
        const name = this.parseSingleIdentifier()
        const items: idl.IDLEnumMember[] = []
        this.skip("{")
        while (!this.seeAndSkip("}")) {
            items.push(this.parseDictionaryEntry())
        }
        this.skip(";")
        return idl.createEnum(name.value, items, {extendedAttributes: ext, documentation: extractDocumentation(ext), nodeLocation: sloc(), nameLocation: name.location})
    }

    parseDictionaryEntry(): idl.IDLEnumMember {
        trac("parseDictionaryEntry")
        const ext = this.parseExtendedAttributes()
        const sloc = this.trackLocation()
        const type = this.parsePrimitiveType()
        const name = this.parseSingleIdentifier()
        let value: Token | undefined
        let extracted: ExtractedLiteral | undefined
        if (this.seeAndSkip("=")) {
            value = this.parseLiteral()
            extracted = extractLiteral(value)
        }
        this.skip(";")
        return idl.createEnumMember(name.value, undefined as any as idl.IDLEnum, type, extracted?.extractedValue, {extendedAttributes: ext, nodeLocation: sloc(), nameLocation: name.location, valueLocation: value?.location})
    }

    parsePackage(): {location: Location, name: string} {
        trac("parsePackage")
        const sloc = this.trackLocation()
        this.skip("package")
        const packagePath = this.parseFullIdentifierOrLiteral()
        this.skip(";")
        return {location: sloc(), name: valueFromIdentifierOrLiteral(packagePath)}
    }

    parseImport(): idl.IDLImport {
        trac("parseImport")
        const sloc = this.trackLocation()
        this.skip("import")
        const importPath = this.parseFullIdentifierOrLiteral()
        let alias: Token | undefined
        if (this.seeAndSkip("as")) {
            alias = this.parseSingleIdentifier()
        }
        this.skip(";")
        return idl.createImport(valueFromIdentifierOrLiteral(importPath).split("."), alias?.value, {nodeLocation: sloc(), nameLocation: alias?.location, valueLocation: importPath.location})
    }

    parseVersion(): idl.IDLVersion {
        trac("parseVersion")
        const sloc = this.trackLocation()
        this.skip("version")
        const versionLiteral = this.parseLiteral()
        this.skip(";")
        return idl.createVersion(versionLiteral.value.split("."), {nodeLocation: sloc(), valueLocation: versionLiteral.location})
    }
}

function prepareOffsets(lines: string[]): number[] {
    let offsets: number[] = []
    let offset = 0
    for (let line of lines) {
        let plus = line.length
        offsets.push(offset)
        offset += plus
    }
    return offsets
}

function valueFromIdentifierOrLiteral(token: Token): string {
    if (token.kind == TokenKind.Words && !literalTypes.has(token.value)) {
        return token.value
    }
    return extractLiteral(token).extractedString
}

const literalTypes = new Map<string, string>([
    ["true", "boolean"],
    ["false", "boolean"],
    ["Infinity", "number"],
    ["-Infinity", "number"],
    ["NaN", "number"],
    ["null", "null"],
    ["undefined", "undefined"],
])

interface ExtractedLiteral {
    type: string
    extractedString: string
    extractedValue: string | number
}

const extractedUndefined: ExtractedLiteral = {type: "undefined", extractedString: "undefined", extractedValue: "undefined"}

function extractLiteral(token: Token): ExtractedLiteral {
    if (token.kind == TokenKind.Words) {
        if (!literalTypes.has(token.value)) {
            IncorrectLiteral.reportDiagnosticMessage([token.location])
            return extractedUndefined
        }
        const type = literalTypes.get(token.value)!
        const extractedString = token.value
        const extractedValue = type == "number" ? parseFloat(extractedString) : extractedString
        return {type, extractedString, extractedValue}
    }
    if (token.kind != TokenKind.Literal) {
        IncorrectLiteral.reportDiagnosticMessage([token.location])
        return extractedUndefined
    }
    if (token.value[0] == "\"") {
        try {
            const extractedString = unescapeString(token.value)
            return {type: "string", extractedString, extractedValue: extractedString}
        }
        catch (e) {
            IncorrectLiteral.reportDiagnosticMessage([token.location], `Incorrect literal: ${(e as Error).message}`)
            return extractedUndefined
        }
    }
    const extractedValue = parseFloat(token.value)
    if (Number.isNaN(extractedValue)) {
        // Real NaNs are handled before that, so report an error
        IncorrectLiteral.reportDiagnosticMessage([token.location])
    }
    return {type: "number", extractedString: token.value, extractedValue}
}

// Taken from deserialize.ts as is
function unescapeString(value: string): string {
    if (!value.length || value[0] !== '"')
        return value
    value = value.slice(1, -1)
    value = value.replace(/\\((['"\\bfnrtv])|([0-7]{1-3})|x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4}))/g, (_, all, c, oct, h2, u4) => {
        if (c !== undefined) {
            switch (c) {
                case "'": return "'"
                case '"': return '"'
                case "\\": return "\\"
                case "b": return "\b"
                case "f": return "\f"
                case "n": return "\n"
                case "r": return "\r"
                case "t": return "\t"
                case "v": return "\v"
            }
        } else if (oct !== undefined) {
            return String.fromCharCode(parseInt(oct, 8))
        } else if (h2 !== undefined) {
            return String.fromCharCode(parseInt(h2, 16))
        } else if (u4 !== undefined) {
            return String.fromCharCode(parseInt(u4, 16))
        }
        throw new Error(`unknown escape sequence: ${_}`)
    });
    return value;
}

function extractInterfaceSubkind(ext?: idl.IDLExtendedAttribute[]): idl.IDLInterfaceSubkind {
    const ent = ext?.find(x => x.name == "Entity")?.value
    switch (ent) {
        case idl.IDLEntity.Class: return idl.IDLInterfaceSubkind.Class
        case idl.IDLEntity.Literal: return idl.IDLInterfaceSubkind.AnonymousInterface
        case idl.IDLEntity.Tuple: return idl.IDLInterfaceSubkind.Tuple
        default: return idl.IDLInterfaceSubkind.Interface
    }
}

function extractDocumentation(ext?: idl.IDLExtendedAttribute[]): string | undefined {
    return ext?.find(x => x.name == "Documentation")?.value
}

function extractOptional(ext?: idl.IDLExtendedAttribute[]): boolean {
    return ext?.some(x => x.name.toLowerCase() == "optional") ?? false
}

function sanitizeTypeParameter(param: string): string {
    const extendsIdx = param.indexOf('extends')
    if (extendsIdx !== -1) {
        return param.substring(0, extendsIdx).trim()
    }
    const eqIdx = param.indexOf('=')
    if (eqIdx !== -1) {
        return param.substring(0, eqIdx).trim()
    }
    return param
}

const LEGACY_TYPE_PARAMETERS_ATTRIBUTE = "TypeParameters"
const LEGACY_TYPE_ARGUMENTS_ATTRIBUTE = "TypeArguments"

function extractTypeArguments(ext?: idl.IDLExtendedAttribute[]): idl.IDLType[] | undefined {
    return ext?.find(x => x.name === LEGACY_TYPE_ARGUMENTS_ATTRIBUTE)?.typesValue
}

function extractTypeParameters(ext?: idl.IDLExtendedAttribute[]): string[] | undefined {
    return ext?.find(x => x.name === LEGACY_TYPE_PARAMETERS_ATTRIBUTE)?.value?.split(",")?.map(sanitizeTypeParameter)
}

const builtinTypesList = [idl.IDLPointerType, idl.IDLVoidType, idl.IDLBooleanType, 
    idl.IDLObjectType, idl.IDLI8Type, idl.IDLU8Type, idl.IDLI16Type, idl.IDLU16Type,
    idl.IDLI32Type, idl.IDLU32Type, idl.IDLI64Type, idl.IDLU64Type, idl.IDLF32Type,
    idl.IDLF64Type, idl.IDLBigintType, idl.IDLNumberType, idl.IDLStringType, idl.IDLAnyType,
    idl.IDLUndefinedType, idl.IDLUnknownType, idl.IDLObjectType, idl.IDLThisType, idl.IDLDate,
    idl.IDLBufferType, idl.IDLSerializerBuffer
]

// Better solution will be to make it registry in idl.ts
const builtinTypes = new Map(builtinTypesList.map(x => [x.name, x]))

const builtinGenericTypeNames = new Set<string>(["sequence", "record", "Promise"])
