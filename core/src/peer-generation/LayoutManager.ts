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

import { IDLEntry } from "../idl";

export enum LayoutNodeRole {
    PEER,
    INTERFACE,
    GLOBAL,
    COMPONENT,
}

export type LayoutTargetDescriptionHint =
      'component.implementation'
    | 'component.interface'
    | 'component.function'

export interface LayoutTargetDescription {
    node: IDLEntry
    role: LayoutNodeRole
    hint?: LayoutTargetDescriptionHint
}

export interface LayoutManagerStrategy {
    resolve(target:LayoutTargetDescription): string
    // TBD: properly define package for external types extractors
    handwrittenPackage(): string
}

export class LayoutManager {
    constructor(
        private strategy: LayoutManagerStrategy
    ) { }

    resolve(target:LayoutTargetDescription): string {
        return this.strategy.resolve(target)
    }
    handwrittenPackage(): string {
        return this.strategy.handwrittenPackage()
    }

    ////////////////////////////////////////////////////////////////////

    static Empty(): LayoutManager {
        return new LayoutManager({ resolve: () => '', handwrittenPackage: () => '' })
    }
}
