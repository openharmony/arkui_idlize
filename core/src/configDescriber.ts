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

import { zip } from "./util"

export interface JsonSchemaLeaf {
    type?: string
    description?: string
}
export interface JsonSchemaArray extends JsonSchemaLeaf {
    items: JsonSchemaNode
}
export interface JsonSchemaTuple extends JsonSchemaLeaf {
    items: JsonSchemaNode[]
}
export interface JsonSchemaMap extends JsonSchemaLeaf {
    additionalProperties: JsonSchemaNode
}
export interface JsonSchemaObject extends JsonSchemaLeaf {
    properties: Record<string, JsonSchemaNode>
    required: string[]
    additionalProperties: boolean
}

export type JsonSchemaNode =
      JsonSchemaLeaf
    | JsonSchemaArray
    | JsonSchemaTuple
    | JsonSchemaMap
    | JsonSchemaObject

export interface JsonSchema {
    $ref: string,
    $schema: string
    definitions: Record<string, JsonSchemaNode>
}

type UnwrapConfigDescriberLeaf<T> = T extends ConfigDescriberLeaf<infer K> ? K : never
type ObjectDescriptionToType<T extends {}> = { readonly [x in keyof T]: UnwrapConfigDescriberLeaf<T[x]> }
type TraverseTuple<Ts extends any[]> = Ts extends []
    ? []
    : Ts extends [infer Head, ...infer Rest]
        ? [UnwrapConfigDescriberLeaf<Head>, ...TraverseTuple<Rest>]
        : never

export interface ValidationSuccess<T> {
    success: true
    value: T
}
export interface ValidationFailure {
    success: false
    errorMessage: string
}
export type ValidationResult<T> =
    ValidationSuccess<T>
    | ValidationFailure

class ValidationBox<T> {
    constructor(
        public box: ValidationResult<T>
    ) { }

    static fail<T>(errorMessage: string): ValidationBox<T> {
        return new ValidationBox({ success: false, errorMessage })
    }

    static ok<T>(value: T): ValidationBox<T> {
        return new ValidationBox({ success: true, value })
    }

    success(): boolean {
        return this.box.success
    }

    unwrap(): T {
        if (this.box.success) {
            return this.box.value
        }
        throw new Error("")
    }

    error(): string {
        if (!this.box.success) {
            return this.box.errorMessage
        }
        throw new Error("")
    }

    get(): ValidationResult<T> {
        return this.box
    }

    or<U>(x: U): ValidationBox<U | T> {
        if (this.box.success) {
            return new ValidationBox(this.box)
        }
        return new ValidationBox({
            success: true,
            value: x
        })
    }
}

class ConfigDescriberLeaf<T> {
    constructor(
        public validate: (x: unknown) => ValidationBox<T>,
        public printSchema: () => JsonSchemaNode,
    ) { }
}

class ConfigDescriberOptionalLeaf<T> extends ConfigDescriberLeaf<T> {
    constructor(
        validate: (x: unknown) => ValidationBox<T>,
        printSchema: () => JsonSchemaNode,
    ) { super(validate, printSchema) }
}

class ConfigDescriberObjectLeaf<T> extends ConfigDescriberLeaf<T> {
    constructor(
        validate: (x: unknown) => ValidationBox<T>,
        printSchema: () => JsonSchemaNode,
        public schema: Record<string, ConfigDescriberLeaf<T>>,
    ) { super(validate, printSchema) }
}

export type ConfigSchema<T> = ConfigDescriberLeaf<T>

export interface CommonBuilderConfig<T> {
    default?: T
    description?: string
}

function mk<T>(typeName:string, check: (x: unknown) => boolean, config?: CommonBuilderConfig<T>) {
    return new ConfigDescriberLeaf<T>(
        x => {
            if (check(x)) {
                return new ValidationBox({
                    success: true,
                    value: x as T
                })
            }
            if (config !== undefined && 'default' in config) {
                return new ValidationBox({
                    success: true,
                    value: config.default as T
                })
            }
            return new ValidationBox({
                success: false,
                errorMessage: `Expected "${typeName}"`
            })
        },
        () => {
            const base: any = {
                type: typeName,
            }
            if (config?.description) {
                base.description = config?.description
            }
            return base
        }
    )
}

export const D = {

    ////////////////////////////////////////
    // Basics

    number(config?: CommonBuilderConfig<number>): ConfigDescriberLeaf<number> {
        return mk('number', x => typeof x === 'number', config)
    },
    string(config?: CommonBuilderConfig<string>): ConfigDescriberLeaf<string> {
        return mk('string', x => typeof x === 'string', config)
    },
    boolean(config?: CommonBuilderConfig<boolean>): ConfigDescriberLeaf<boolean> {
        return mk('boolean', x => typeof x === 'boolean', config)
    },
    bigint(config?: CommonBuilderConfig<bigint>): ConfigDescriberLeaf<bigint> {
        return mk('bigint', x => typeof x === 'bigint', config)
    },
    null(config?: CommonBuilderConfig<null>): ConfigDescriberLeaf<null> {
        return mk('null', x => x === null, config)
    },
    undefined(config?: CommonBuilderConfig<undefined>): ConfigDescriberLeaf<undefined> {
        return mk('undefined', x => x === undefined, config)
    },
    object<K extends Record<string, ConfigDescriberLeaf<any>>>(schema: K): ConfigDescriberObjectLeaf<ObjectDescriptionToType<K>> {
        return new ConfigDescriberObjectLeaf(x => {
            if (x !== undefined) {
                if (typeof x !== 'object') {
                    return ValidationBox.fail(`Expected object, but got "${typeof x}"`)
                }
                if (x === null) {
                    return ValidationBox.fail(`Expected object, but got "null"`)
                }
            }
            const obj = x as any
            const sh = schema

            const result = {} as any
            const errors: string[] = []
            for (const key in schema) {
                const box = sh[key].validate(
                    obj === undefined ? undefined : obj[key]
                )
                if (box.success()) {
                    const val = box.unwrap()
                    if (val === undefined && obj !== undefined && !(key in obj)) {
                        continue
                    }
                    result[key] = val
                } else {
                    errors.push(`"${key}":\n${box.error().split('\n').map(s => '\t' + s).join('\n')}`)
                }
            }

            if (errors.length) {
                return ValidationBox.fail(errors.join('\n'))
            }

            return new ValidationBox({
                success: true,
                value: result
            })
        },
            () => {
                const properties: Record<string, JsonSchemaNode> = {}
                const required: string[] = []
                for (const key in schema) {
                    const leaf = schema[key]
                    properties[key] = leaf.printSchema()
                    if (!(leaf instanceof ConfigDescriberOptionalLeaf)) {
                        required.push(key)
                    }
                }
                return {
                    additionalProperties: false,
                    properties,
                    required,
                    type: "object"
                }
            },
            schema)
    },

    ////////////////////////////////////////
    // Advanced

    maybe<T>(type: ConfigDescriberLeaf<T>): ConfigDescriberOptionalLeaf<T | undefined> {
        return new ConfigDescriberOptionalLeaf(x => {
            if (x === undefined) {
                return ValidationBox.ok(undefined)
            }
            return type.validate(x)
        }, () => {
            return type.printSchema()
        })
    },
    default<T>(type: ConfigDescriberLeaf<T>, def: T): ConfigDescriberOptionalLeaf<T> {
        return new ConfigDescriberOptionalLeaf(x => {
            return type.validate(x).or(def)
        }, () => {
            return type.printSchema()
        })
    },
    array<T>(type: ConfigDescriberLeaf<T>, initAsEmpty: boolean = true): ConfigDescriberLeaf<T[]> {
        return new ConfigDescriberLeaf(xs => {
            if ((xs === undefined || xs === null) && initAsEmpty) {
                return ValidationBox.ok([])
            }
            if (!Array.isArray(xs)) {
                return ValidationBox.fail("Expected array")
            }
            const result: T[] = []
            for (const x of xs) {
                const box = type.validate(x)
                if (!box.success()) {
                    return ValidationBox.fail("Array item: " + box.error())
                }
                result.push(box.unwrap())
            }
            return ValidationBox.ok(result)
        }, () => {
            return {
                type: 'array',
                items: type.printSchema()
            }
        })
    },
    map<K, V>(keySchema: ConfigDescriberLeaf<K>, valSchema: ConfigDescriberLeaf<V>): ConfigDescriberLeaf<Map<K, V>> {
        return new ConfigDescriberLeaf(x => {
            if (x === undefined) {
                return ValidationBox.fail(`Expected Map, but got "undefined"`)
            }
            if (typeof x !== 'object' || x === null) {
                return ValidationBox.fail(`Expected Map, but got "${x === null ? 'null' : typeof x}"`)
            }
            const result = new Map()
            const iterable = x instanceof Map ? x : Object.entries(x)
            for (const [key, val] of iterable) {
                const keyResult = keySchema.validate(key)
                if (!keyResult.success()) {
                    return ValidationBox.fail("Map key: " + keyResult.error())
                }
                const valResult = valSchema.validate(val)
                if (!valResult.success()) {
                    return ValidationBox.fail("Map value: " + valResult.error())
                }
                result.set(keyResult.unwrap(), valResult.unwrap())
            }
            return ValidationBox.ok(result)
        }, () => {
            return {
                type: 'object',
                additionalProperties: valSchema.printSchema()
            }
        })
    },
    tuple<Ts extends ConfigDescriberLeaf<any>[]>(...items:Ts): ConfigDescriberLeaf<TraverseTuple<Ts>> {
        return new ConfigDescriberLeaf(xs => {
            if (!Array.isArray(xs)) {
                return ValidationBox.fail('Expected tuple')
            }
            if (xs.length !== items.length) {
                return ValidationBox.fail(`Expected tuple of size ${items.length}, but size was ${xs.length}`)
            }
            const result: any[] = []
            zip(xs, items).forEach(([val, leaf], i) => {
                const r = leaf.validate(val)
                if (!r.success()) {
                    return ValidationBox.fail(`Tuple position ${i}: ${r.error()}`)
                }
                result.push(r.unwrap())
            })
            return ValidationBox.ok(result as TraverseTuple<Ts>)
        }, () => {
            return {
                items: items.map(it => it.printSchema())
            }
        })
    },

    ////////////////////////////////////////
    // Utils

    combine<A, B>(a: ConfigDescriberObjectLeaf<A>, b: ConfigDescriberObjectLeaf<B>): ConfigDescriberObjectLeaf<A & B> {
        const keysA = new Set(Object.keys(a.schema))
        const keysB = Object.keys(b.schema)
        for (const key of keysB) {
            if (keysA.has(key)) {
                throw new Error(`Can not combine objects with same keys. Key: "${key}"`)
            }
        }
        return D.object({
            ...a.schema,
            ...b.schema,
        }) as ConfigDescriberObjectLeaf<A & B>
    },

    ////////////////////////////////////////
    // Helpers

    printJSONSchema<T>(schema: ConfigDescriberLeaf<T>): string {
        const configSchema = schema.printSchema()
        if ("properties" in configSchema) {
            configSchema.properties.$schema = {
                type: "string",
                description: "The schema to verify this document against."
            }
        }
        const json: JsonSchema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            $ref: "#/definitions/configSchema",
            definitions: {
                configSchema
            }
        }
        return JSON.stringify(json, null, 4)
    }
}

export type ConfigTypeInfer<T> = UnwrapConfigDescriberLeaf<T>
