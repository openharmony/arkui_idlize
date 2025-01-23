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

import * as idl from './idl'

export interface IDLLibrary {
    readonly files: readonly IDLFile[]
}

export interface IDLFile {
    fileName: string
    package?: idl.IDLPackage
    entities: idl.IDLNode[]
}

function createLibrary(files:IDLFile[]): IDLLibrary {
    return {
        files
    }
}

function toLibrary(ii:Iterable<IDLFile>): IDLLibrary {
    return {
        files: Array.from(ii)
    }
}

const queryCache = new Map<string, any>()
function cached<A, R>(key: string, f:(x:A) => R): (x:A) => R {
    return x => {
        if (queryCache.has(key)) {
            return queryCache.get(key)!
        }
        const v = f(x)
        queryCache.set(key, v)
        return v
    }
}

export interface LibraryQuery<A, R> {
    fn: (x:A) => R
    key: string
    _reqBrand: unknown
}
export interface LibraryReducer<R> {
    fn: (x:IDLLibrary) => R
    key: string
    _redBrand: unknown
}

function reduce<R>(key:string, f:(x:IDLLibrary) => R): LibraryReducer<R> {
    return {
        fn: cached(key, f),
        key,
        _redBrand: {}
    }
}

function req<A, R>(key:string, fn:(x:A) => R): LibraryQuery<A, R> {
    return {
        fn,
        key,
        _reqBrand: {}
    }
}

function compose<B, R>(base:LibraryReducer<B>, next: LibraryQuery<B, R>): LibraryReducer<R> {
    const key = base.key + '.' + next.key
    return {
        fn: cached(key, x => next.fn(base.fn(x))),
        key,
        _redBrand: {}
    }
}

function concat<A, R1, R2>(f:LibraryQuery<A, R1>, g:LibraryQuery<A, R2>): LibraryQuery<A, [R1, R2]> {
    const key = `$pair{${f.key},${g.key}}`
    return {
        fn: cached(key, x => {
            const r1 = f.fn(x)
            const r2 = g.fn(x)
            return [r1, r2]
        }),
        key,
        _reqBrand: {}
    }
}

class LensBuilder<R> {
    
    private constructor(
        private req: LibraryReducer<R>
    ) {}

    static make<R>(r:LibraryReducer<R>) {
        return new LensBuilder<R>(r)
    }

    pipe<T>(r:LibraryQuery<R, T>): LensBuilder<T> {
        return new LensBuilder(
            compose(this.req, r)
        )
    }

    row<T>(key:string, f:(x:R) => T): LensBuilder<T> {
        return this.pipe(req(key, f))
    }

    query(): LibraryReducer<R> {
        return this.req
    }
}

export function lens<R>(r:LibraryReducer<R>): LensBuilder<R> {
    return LensBuilder.make(r)
}

export type QueryType<T> = LibraryQuery<IDLLibrary, T> | LensBuilder<T>

export function query<T>(lib:IDLLibrary, input:QueryType<T>): T {
    const request = input instanceof LensBuilder ? input.query() : input
    return request.fn(lib)
}

// UTILS

const utils = {
    idx: <T>(x:number) => req<T[], T | undefined>('idx', xs => xs.at(x)),
    fst: <T>() => req<T[], T | undefined>('fst', xs => xs.at(0)),
    lst: <T>() => req<T[], T | undefined>('lst', xs => xs.at(-1)), 
}

const select = {
    files(): LibraryReducer<readonly IDLFile[]> {
        return reduce('files', x => x.files)
    },
    entities(traverseNamespaces = false): LibraryQuery<readonly IDLFile[], idl.IDLNode[]> {
        if (traverseNamespaces) {
            function go(node:idl.IDLNode): idl.IDLNode[] {
                if (idl.isNamespace(node)) {
                    return node.members.flatMap(go)
                }
                return [node]
            }
            return req('entities.flat', xs => {
                return xs.flatMap(x => x.entities).flatMap(go)
            })
        }
        return req('entities', xs => xs.flatMap(x => x.entities))
    },
    entries(): LibraryQuery<idl.IDLNode[], idl.IDLEntry[]> {
        return req('entries', xs => xs.filter(idl.isEntry))
    },
    interfaces(): LibraryQuery<idl.IDLNode[], idl.IDLInterface[]> {
        return req('interfaces', it => it.filter(idl.isInterface))
    },
    names(): LibraryQuery<idl.IDLNode[], string[]> {
        return req('names', xs => xs.flatMap(x => idl.isNamedNode(x) ? [x.name] : []))
    },
    name(name:string): LibraryReducer<idl.IDLNode[]> {
        return reduce(`select.by.name.${name}`, lib => {
            return lib.files.flatMap(it => {
                return it.entities.flatMap(it => {
                    if (idl.isNamedNode(it) && it.name === name) {
                        return [it]
                    }
                    return []
                })
            })
        })   
    },
}

export const lib = {
    createLibrary,
    toLibrary,
    
    lens,
    query,

    select,
    utils,

    req,
    compose,
    concat
}
