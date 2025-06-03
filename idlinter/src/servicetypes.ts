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

/**
 * Helper construction that works as "any" type restricted by fields and types from (T1|T2). It's not possible on unions directly, so wrapper is required.
 */
export type UN<T1, T2> = {
  [K in (keyof T1 | keyof T2)]: K extends keyof T1 ? (K extends keyof T2 ? T1[K] | T2[K] : T1[K] | undefined) : (K extends keyof T2 ? T2[K] | undefined : undefined)
}

/**
 * Custom version of well known recipe extended for patterns with field existence checking via comparison with {}.
 */
export type RecursivePartial<T> = {
  [P in keyof T]?:
    // also, no arrays in patterns currently
    // T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
    T[P] | {};
}
