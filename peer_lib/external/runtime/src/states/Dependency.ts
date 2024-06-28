/*
 * Copyright (c) 2022-2024 Huawei Device Co., Ltd.
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

const SKIP_FRAMES = 10

/** This interface represents an unique observer that can be notified that some changes. */
export interface Dependency {
    /** Returns `true` if the dependency is no longer actual. */
    readonly obsolete: boolean

    /** Notifies the dependency that it should be invalidated. */
    invalidate(): void
}

/** This class allows to store and update all dependencies. */
export class Dependencies {
    private frame = 0
    private dependencies: Set<Dependency> | undefined = undefined
    private latest: Dependency | undefined = undefined

    /** Returns `true` if there are no dependencies to invalidate. */
    get empty(): boolean {
        return this.dependencies !== undefined
            ? this.dependencies!.size == 0
            : this.latest === undefined
    }

    /** @param dependency - a dependency to invalidate */
    register(dependency?: Dependency): void {
        if (dependency === undefined || dependency == this.latest || dependency.obsolete) return
        if (this.dependencies !== undefined) {
            this.dependencies!.add(dependency)
        } else if (this.latest !== undefined) {
            this.dependencies = new Set<Dependency>()
            this.dependencies!.add(this.latest!)
            this.dependencies!.add(dependency)
        }
        this.latest = dependency
    }

    /** Invalidates all dependencies and removes obsolete ones. */
    updateDependencies(invalidate: boolean): void {
        if (++this.frame < SKIP_FRAMES && !invalidate) return
        this.frame = 0
        if (this.dependencies !== undefined) {
            let disposed: Array<Dependency> | undefined = undefined
            const it = this.dependencies!.keys()
            while (true) {
                const result = it.next()
                if (result.done) break
                const dependency = result.value as Dependency
                if (!updateDependency(invalidate, dependency)) {
                    if (disposed) {
                        disposed.push(dependency)
                    } else {
                        disposed = Array.of<Dependency>(dependency)
                    }
                }
            }
            if (disposed) {
                let index = disposed.length
                while (0 < index--) this.dependencies!.delete(disposed[index])
            }
        } else if (this.latest !== undefined && !updateDependency(invalidate, this.latest!)) {
            this.latest = undefined
        }
    }
}

function updateDependency(invalidate: boolean, dependency: Dependency): boolean {
    if (dependency.obsolete) return false
    if (invalidate) dependency.invalidate()
    return true
}
