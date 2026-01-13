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

import { convertType, createAlgotithmicReferenceResolver, DiagnosticMessageGroup, isDefined, parseIDLFile, stringOrNone, TypeConvertor } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"

class Reporter {
    readonly errors = new DiagnosticMessageGroup("error", "Compat", "Incompatible API change")

    readonly typeNameConvertor = new (class implements TypeConvertor<string> {
        convertPrimitiveType(type: idl.IDLPrimitiveType): string {
            return type.name
        }
        convertTypeReference(type: idl.IDLReferenceType): string {
            return type.name
        }
        convertTypeReferenceAsImport(type: idl.IDLReferenceType): string {
            return type.name
        }
        convertTypeParameter(type: idl.IDLTypeParameterType): string {
            return type.name
        }
        convertImport(type: idl.IDLImport): string {
            return type.name
        }
        convertOptional(type: idl.IDLOptionalType): string {
            return `optional ${convertType(this, type.type)}`
        }
        convertUnion(type: idl.IDLUnionType): string {
            return type.types.map(ty => convertType(this, ty)).join(' or ')
        }
        convertContainer(type: idl.IDLContainerType): string {
            return `${type.containerKind}<${type.elementType.map(ty => convertType(this, ty)).join(', ')}>`
        }
    })
    typeName(type: idl.IDLType): string {
        return convertType(this.typeNameConvertor, type)
    }

    makeDecorator(node?: idl.IDLNode): stringOrNone {
        if (!node)
            return undefined
        if (idl.isProperty(node)) {
            const accessor = idl.getExtAttribute(node, idl.IDLExtendedAttributes.Accessor)
            return `: ${this.typeName(node.type)}${accessor ? ` [${accessor}]` : ''}`
        }
        if (idl.isMethod(node) || idl.isConstructor(node)) {
            return `(${node.parameters.map(p => this.typeName(p.type)).join(', ')})`
        }
        return ''
    }

    report(message: string, node?: idl.IDLNode) {
        const decorator = this.makeDecorator(node)
        const crumbs: string[] = []
        for (; node && !idl.isFile(node); node = node.parent) {
            if (idl.isConstructor(node))
                crumbs.unshift('constructor')
            else if (idl.isNamedNode(node))
                crumbs.unshift(node.name)
        }
        if (node && idl.isFile(node))
            crumbs.unshift(...node.packageClause)
        const locations = node?.nodeLocation ? [node.nodeLocation] : []
        this.errors.reportDiagnosticMessage(locations, `${message}: ${crumbs.join('.')}${decorator ?? ''}`)
    }
}

class Checker {
    constructor(
        private baseFiles: idl.IDLFile[],
        private commitFiles: idl.IDLFile[]
    ) {}
    readonly typedefs = new Map<string, idl.IDLType>()
    readonly baseResolver = createAlgotithmicReferenceResolver(this.baseFiles)
    readonly commitResolver = createAlgotithmicReferenceResolver(this.commitFiles)
    readonly reporter = new Reporter()

    isCompatibleType(base?: idl.IDLType, commit?: idl.IDLType): boolean {
        if (!base || !commit)
            return base === commit
        else if (idl.isPrimitiveType(base) && idl.isPrimitiveType(commit))
            return base === commit
        else if (idl.isContainerType(base) && idl.isContainerType(commit))
            return base.containerKind === commit.containerKind &&
                base.elementType.length === commit.elementType.length &&
                base.elementType.every((it, index) => this.isCompatibleType(it, commit.elementType[index]))
        else if (idl.isOptionalType(base) && idl.isOptionalType(commit))
            return this.isCompatibleType(base.type, commit.type)
        else if (idl.isUnionType(base) && idl.isUnionType(commit))
            return base.types.length === commit.types.length &&
                base.types.every(type => isDefined(commit.types.find(it => this.isCompatibleType(it, type))))
        else if (idl.isTypeParameterType(base) && idl.isTypeParameterType(commit))
            return true
        else if (idl.isReferenceType(base) && idl.isReferenceType(commit)) {
            if (base.name === commit.name)
                return true
            const baseDecl = this.baseResolver.resolveTypeReference(base)
            const commitDecl = this.commitResolver.resolveTypeReference(commit)
            if (baseDecl && commitDecl && idl.isCallback(baseDecl) && idl.isCallback(commitDecl))
                return this.isCompatibleCallback(baseDecl, commitDecl)
        }
        return idl.isReferenceType(commit) && this.isCompatibleType(base, this.typedefs.get(commit.name)) ||
               idl.isReferenceType(base) && this.isCompatibleType(this.typedefs.get(base.name), commit)
    }

    isCompatibleCallback(base: idl.IDLCallback, commit: idl.IDLCallback): boolean {
        return this.isCompatibleType(base.returnType, commit.returnType) &&
            base.parameters.length === commit.parameters.length &&
            base.parameters.every((p, i) => this.isCompatibleType(p.type, commit.parameters[i].type))
    }

    checkType(message: string, node: idl.IDLEntry, base?: idl.IDLType, commit?: idl.IDLType) {
        if (!this.isCompatibleType(base, commit))
            this.reporter.report(message, node)
    }

    checkFunction(base: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor, commit?: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor) {
        if (!commit)
            this.reporter.report('Missing function', base)
        else {
            this.checkType('Return type mismatch', commit, base.returnType, commit.returnType)
            if (idl.isMethod(base) && idl.isMethod(commit)) {
                if (base.isOptional !== commit.isOptional)
                    this.reporter.report('Optional attribute changed', commit)
                if (base.isStatic !== commit.isStatic)
                    this.reporter.report('Static attribute changed', commit)
            }
        }
    }

    checkProperty(base: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember, commit?: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember) {
        if (!commit)
            this.reporter.report('Missing property', base)
        else {
            this.checkType('Property type mismatch', commit, base.type, commit.type)
            if (idl.hasExtAttribute(base, idl.IDLExtendedAttributes.Optional) !== idl.hasExtAttribute(commit, idl.IDLExtendedAttributes.Optional))
                this.reporter.report('Optional attribute changed', commit)
        }
    }

    checkEnum(base: idl.IDLEnum, commit?: idl.IDLEnum) {
        if (!commit)
            this.reporter.report('Missing enum', base)
        else {
            base.elements.forEach(elem => this.checkProperty(elem, commit.elements.find(it => it.name === elem.name)))
        }
    }

    checkInterface(base: idl.IDLInterface, commit?: idl.IDLInterface) {
        if (!commit)
            this.reporter.report('Missing interface', base)
        else {
            base.inheritance.forEach(type => this.checkType('Inheritance mismatch', commit, type, commit.inheritance.find(it => it.name === type.name)))
            base.properties.forEach(prop => this.checkProperty(prop, commit.properties.find(it => this.isSameProperty(prop, it))))
            base.methods.forEach(method => this.checkFunction(method, commit.methods.find(it => this.isSameOverload(method, it))))
            base.constructors.forEach(ctor => this.checkFunction(ctor, commit.constructors.find(it => this.isSameOverload(ctor, it))))
        }
    }

    checkNamespace(base: idl.IDLNamespace, commit?: idl.IDLNamespace) {
        if (!commit)
            this.reporter.report('Missing namespace', base)
        else
            this.checkEntries(base.members, commit.members)
    }

    checkEntries(base: idl.IDLEntry[], commit: idl.IDLEntry[]) {
        base.forEach(e => {
            if (idl.isEnum(e))
                this.checkEnum(e, this.findEntry(commit, e, idl.isEnum))
            else if (idl.isInterface(e))
                this.checkInterface(e, this.findEntry(commit, e, x => idl.isInterface(x) && x.subkind === e.subkind))
            else if (idl.isConstant(e))
                this.checkProperty(e, this.findEntry(commit, e, idl.isConstant))
            else if (idl.isMethod(e))
                this.checkFunction(e, this.findEntry(commit, e, x => idl.isMethod(x) && this.isSameOverload(e, x)))
            else if (idl.isNamespace(e))
                this.checkNamespace(e, this.findEntry(commit, e, idl.isNamespace))
        })
    }

    findEntry<T extends idl.IDLEntry>(entries: idl.IDLEntry[], entry: T, predicate: (e: idl.IDLEntry) => boolean): T | undefined {
        const candidates = entries.filter(it => predicate(it) && it.name === entry.name) as T[]
        if (candidates.length > 1) {
            if (entry.parent && idl.isFile(entry.parent)) {
                const pkg = entry.parent.packageClause.join('.')
                return candidates.find(it => it.parent && idl.isFile(it.parent) && it.parent.packageClause.join('.') === pkg)
            }
        }
        return candidates[0]
    }

    isSameProperty(base: idl.IDLProperty, commit: idl.IDLProperty) {
        return base.name === commit.name &&
            idl.getExtAttribute(base, idl.IDLExtendedAttributes.Accessor) === idl.getExtAttribute(commit, idl.IDLExtendedAttributes.Accessor) &&
            this.isCompatibleType(base.type, commit.type)
    }

    isSameOverload(base: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor, commit: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor) {
        return base.name === commit.name &&
            base.parameters.length === commit.parameters.length &&
            base.parameters.every((it, index) => this.isCompatibleType(it.type, commit.parameters[index].type))
    }
}

export function checkCompat(baseFiles: Set<string>, commitFiles: Set<string>, loadFiles: Set<string>) {
    const parse = (files: Set<string>) => Array.from(files).map(f => parseIDLFile(f))
    const [base, commit, load] = [baseFiles, commitFiles, loadFiles].map(parse)
    const checker = new Checker(base, commit)
    const getAllEntries = (files: idl.IDLFile[]) => files.flatMap(f => f.entries)
    const [baseEntries, commitEntries, loadEntries] = [base, commit, load].map(getAllEntries)
    for (const e of [...baseEntries, ...commitEntries, ...loadEntries].filter(idl.isTypedef))
        checker.typedefs.set(e.name, e.type)
    checker.checkEntries(baseEntries, commitEntries)
}
