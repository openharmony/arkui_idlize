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

import * as path from 'node:path'
import * as fs from "node:fs"
import { Language } from './Language.js'

export function arrayAt<T>(array: T[] | undefined, index: number): T | undefined {
    return array ? array[index >= 0 ? index : array.length + index] : undefined
}

export function isDefined<T>(value: T | null | undefined): value is T {
    return !!value
}

export function capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function capitalizeConstantName(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

export function dropLast(text: string, chars: number): string {
    return text.substring(0, text.length - chars)
}

export function dropSuffix(text: string, suffix: string): string {
    if (!text.endsWith(suffix)) return text
    return dropLast(text, suffix.length)
}

export type stringOrNone = string | undefined

export function toSet(option: string | undefined): Set<string> {
    let set = new Set<string>()
    if (option) {
        option
            .split(",")
            .forEach(it => set.add(it))
    }
    return set
}

export function getOrPut<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V {
    const gotten = map.get(key)
    if (gotten) {
        return gotten
    }
    const created = create(key)
    map.set(key, created)
    return created
}

export function indentedBy(input: string, indentedBy: number): string {
    if (input.length > 0 || input.endsWith('\n')) {
        let space = ""
        for (let i = 0; i < indentedBy; i++) space += "    "
        return `${space}${input}`
    } else {
        return ""
    }
}

export function forEachExpanding<T>(array: T[], action: (element: T) => void): void {
    let i = 0
    while (true) {
        if (i === array.length) break
        action(array[i])
        i += 1
    }
}

export function zip<A, B>(left: readonly A[], right: readonly B[]): [A, B][] {
    if (left.length != right.length) throw new Error("Arrays of different length")
    return left.map((_, i) => [left[i], right[i]])
}

export function zipStrip<A, B>(left: readonly A[], right: readonly B[]): [A, B][] {
    const result: [A, B][] = []
    for (let i = 0; i < left.length && i < right.length; ++i) {
        result.push([left[i], right[i]])
    }
    return result
}

export function snakeCaseToCamelCase(input: string, tailToLowerCase: boolean = false): string {
    return input
        .split("_")
        .map(it => capitalize(tailToLowerCase ? it.toLowerCase() : it))
        .join("")
}

export function toCamelCase(input: string): string {
    return input
        .replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
        .replace(/^[A-Z]/, match => match.toLowerCase());
}

export function isUpperCase(s: string): boolean {
    return s === s.toUpperCase()
}

function isLowerCase(s: string): boolean {
    return s === s.toLowerCase()
}

function isDigit(s: string): boolean {
    return s >= '0' && s <= '9'
}

export function camelCaseToUpperSnakeCase(input: string) {

    function boundaryFromLowerToUpperCase(s1: string, s2: string): string {
        return s2 !== undefined && (isLowerCase(s1) && !isDigit(s1)) && (isUpperCase(s2)) ? '_' : ''
    }

    function toUpperSnakeCase(s: string): string {
        return Array.from(s)
            .map((c, i) => `${c.toUpperCase()}${boundaryFromLowerToUpperCase(c, s[i + 1])}`)
            .join('')
    }

    return input.split('_')
        .filter(s => s !== "")
        .map(s => toUpperSnakeCase(s))
        .join('_')
}

export function camelCaseToLowerSnakeCase(input: string) {
    return camelCaseToUpperSnakeCase(input).toLowerCase()
}

export function renameDtsToPeer(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName))
        .replace(".d.ts", "")
        .replace(".idl", "")
        .concat("Peer")
    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameDtsToComponent(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName))
        .replace(".d.ts", "")
        .replace(".idl", "")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameDtsToInterfaces(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName), "Interfaces")
        .replace(".d.ts", "")
        .replace(".idl", "")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameClassToBuilderClass(className: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(className))
        .concat("Builder")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameClassToMaterialized(className: string, language: Language, withFileExtension: boolean = true) {

    const name = className.endsWith("Internal") ? className.substring(0, className.length - "Internal".length) : className
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(name))
        .concat("Materialized")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function throwException(message: string): never {
    throw new Error(message)
}

/**
 * Add a prefix to an enum value which camel case name coincidence
 * with the the same upper case name for an another enum value
 */
export function nameEnumValues(enumTarget: string[]): string[] {
    const prefix = "LEGACY"
    const nameToIndex = new Map<string, number>()
    enumTarget.forEach((name, index) => {
            let upperCaseName: string
            if (isUpperCase(name)) {
                upperCaseName = name
                const i = nameToIndex.get(upperCaseName)
                if (i !== undefined) {
                    nameToIndex.set(`${prefix}_${upperCaseName}`, i)
                }
            } else {
                upperCaseName = camelCaseToUpperSnakeCase(name)
                if (nameToIndex.has(upperCaseName)) {
                    upperCaseName = `${prefix}_${upperCaseName}`
                }
            }
            nameToIndex.set(upperCaseName, index)
        })
    const enumValues = new Array<string>(nameToIndex.size)
    for (const [name, index] of nameToIndex.entries()) {
        enumValues[index] = name
    }
    return enumValues
}

export function groupBy<K, V>(values: V[], selector: (value: V) => K): Map<K, V[]> {
    const map = new Map<K, V[]>()
    values.forEach(value => {
        const key = selector(value)
        getOrPut(map, key, it => []).push(value)
    })
    return map
}

export function groupByIndexed<K, V>(values: V[], selector: (value: V) => K): Map<K, [V, number][]> {
    const map = new Map<K, [V, number][]>()
    values.forEach((it, index) =>
        getOrPut(map, selector(it), () => [])
            .push([it, index])
    )
    return map
}

export function removeExt(filename: string) {
    return filename.replaceAll(path.extname(filename), '')
}

export function warn(message: string) {
    console.log(`WARNING: ${message}`)
}

export function hashCodeFromString(value: string): number {
    let hash = 5381
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 33) ^ value.charCodeAt(i)
        hash |= 0
    }
    return hash
}

export function forceWriteFile(filePath: string, content: string): void {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, content)
}

export function findVersion() {
    if (process.env.npm_package_version) return process.env.npm_package_version
    let packageJson = path.join(__dirname, '..', 'package.json')
    try {
        let json = fs.readFileSync(packageJson).toString()
        return json ? JSON.parse(json).version : undefined
    } catch (e) {
        return undefined
    }
}

export function zipMany<T>(...xs: T[][]): Array<Array<T | undefined>> {
    const max = xs.reduce((max, it) => it.length > max ? it.length : max, 0)
    const result: Array<Array<T | undefined>> = []
    for (let i = 0; i < max; ++i) {
        const row: Array<undefined | T> = []
        for (const x of xs) {
            const element = i < x.length
                ? x[i]
                : undefined
            row.push(element)
        }
        result.push(row)
    }
    return result
}

export class Lazy<T> {
    private readonly factory: () => T
    constructor(factory: () => T) {
        this.factory = factory
    }

    private instantiated: boolean = false
    private instance: T | undefined
    get value(): T {
        if (!this.instantiated) {
            this.instance = this.factory()
            this.instantiated = true
        }
        return this.instance as T
    }
}

export function lazy<T>(factory: () => T): Lazy<T> {
    return new Lazy(factory)
}

export function rightmostIndexOf<T>(array: T[], predicate: (value: T) => boolean): number {
    let result = -1
    array.forEach((it, index) => {
        if (predicate(it)) {
            result = index
        }
    })
    return result
}

type StringProperties<T> = {
    [Property in keyof T as (T[Property] extends string ? Property : never)]: T[Property]
}

// sort array using external key function or internal string property
export function sorted<T, N extends keyof StringProperties<T>>(array: T[], key: ((value: T) => string) | N): T[] {
    const comparator = new Intl.Collator()
    if (typeof key === "function") {
        return array.map(it => { return { sortKey: key(it), value: it } })
            .sort((a, b) => comparator.compare(a.sortKey, b.sortKey))
            .map(it => it.value)
    }
    return array.map(it => it)
        .sort((a, b) => comparator.compare(a[key] as string, b[key] as string))
}

export function getSyntheticTypesFileName(): string {
    return "synthetic_types"
}

export function removePoints(s: string) {
    return s.split(/[\.\-]/g).join('_')
}

export function scanDirectory(dir: string, fileFilter: (file: string) => boolean, recursive = false): string[] {
    const dirsToVisit = [path.resolve(dir)]
    const result = []
    while (dirsToVisit.length > 0) {
        let dir = dirsToVisit.pop()!
        let dirents = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of dirents) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isFile()) {
                if (fileFilter(fullPath)) { result.push(fullPath) }
            } else if (recursive && entry.isDirectory()) {
                dirsToVisit.push(fullPath)
            }
        }
    }

    return result
}

export function scanInputDirs(inputDirs: string[]): string[]
export function scanInputDirs(inputDirs: string[], fileExtension: string): string[]
export function scanInputDirs(inputDirs: string[], fileFilter: (file: string) => boolean, recursive: boolean): string[]
export function scanInputDirs(
    inputDirs: string[],
    fileFilter: undefined | string | ((file: string) => boolean) = undefined,
    recursive = false,
): string[] {
    if (typeof fileFilter === 'undefined')
        return scanInputDirs(inputDirs, (_) => true, recursive)
    if (typeof fileFilter === 'string')
        return scanInputDirs(inputDirs, (file: string) => file.endsWith(fileFilter), recursive)
    const resolvedInputDirs = inputDirs.map(dir => path.resolve(dir))
    console.log("Resolved input directories:", resolvedInputDirs)
    return resolvedInputDirs.flatMap(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            console.log(`Processing all definitions from directory: ${dir}`)
            return scanDirectory(dir, fileFilter, recursive)
        } else {
            console.warn(`Warning: Directory does not exist or is not a directory: ${dir}`)
            return []
        }
    }).sort((a, b) => {
        return path.basename(a).localeCompare(path.basename(b))
    })
}

const printedWarnMessages = new Set<string>()
export function consoleWarn(message: string) {
    if (printedWarnMessages.has(message)) return
    printedWarnMessages.add(message)
    console.warn(message)
}