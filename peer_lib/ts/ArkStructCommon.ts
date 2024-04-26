/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import { ArkCustomComponent } from "@koalaui/arkui-common";
import { ArkComponent } from "./ArkComponent";

export class ArkStructCommon extends ArkComponent implements ArkCustomComponent {
    build(): void { throw new Error("no implemented") }

    // by unknown reason following methods were defined in ArkComponent 
    // class in koala repo. I do not like that approach, so kept them 
    // in ArkStructCommon for now.
    aboutToAppear?(): void { throw new Error("no implemented") }
    aboutToDisappear?(): void { throw new Error("no implemented") }
    aboutToReuse?(params: { [key: string]: unknown }): void { throw new Error("no implemented") }
    aboutToRecycle?(): void { throw new Error("no implemented") }
    onLayout?(children: Array<LayoutChild>, constraint: ConstraintSizeOptions): void { throw new Error("no implemented") }
    onPlaceChildren?(selfLayoutInfo: GeometryInfo, children: Array<Layoutable>, constraint: ConstraintSizeOptions): void { throw new Error("no implemented") }
    onMeasure?(children: Array<LayoutChild>, constraint: ConstraintSizeOptions): void { throw new Error("no implemented") }
    onMeasureSize?(selfLayoutInfo: GeometryInfo, children: Array<Measurable>, constraint: ConstraintSizeOptions): SizeResult { throw new Error("no implemented") }
    onPageShow?(): void { throw new Error("no implemented") }
    onPageHide?(): void { throw new Error("no implemented") }
    onFormRecycle?(): string { throw new Error("no implemented") }
    onFormRecover?(statusData: string): void { throw new Error("no implemented") }
    onBackPress?(): void | boolean { throw new Error("no implemented") }
    pageTransition?(): void { throw new Error("no implemented") }
    getUIContext(): UIContext { throw new Error("no implemented") }
    getUniqueId(): number { throw new Error("no implemented") }
    queryNavDestinationInfo(): NavDestinationInfo | undefined { throw new Error("no implemented") }
    queryNavigationInfo(): NavigationInfo | undefined { throw new Error("no implemented") }
    onDidBuild?(): void { throw new Error("no implemented") }
}

export abstract class ArkCommonStruct0<T extends ArkCommonStruct0<T>> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct0<S>>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(): void { throw new Error("not implemented") }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void)
    ): void { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void)
    ): void
}

export abstract class ArkCommonStruct1<T, A1> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct1<S, A1>, A1>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1): void { }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1
    ): void

    /** @memo */
    protected _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1
    ) { throw new Error("not implemented") }
}

export abstract class ArkStructBase<T> extends ArkCommonStruct1<T, Partial<T>>{
    // Can be overridden as an effect of @Prop, @Watch etc
    /** @memo */
    protected __updateStruct(arg1?: Partial<T>): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        initializers?: Partial<T>
    ) { throw new Error("not implemented") }
}

export abstract class ArkCommonStruct2<T, A1, A2> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct2<S, A1, A2>, A1, A2>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1, arg2?: A2): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1, arg2?: A2
    ): void
}

export abstract class ArkCommonStruct3<T, A1, A2, A3> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct3<S, A1, A2, A3>, A1, A2, A3>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2, arg3?: A3
    ): S {
        throw new Error("not implemented") 
    }
    protected __initializeStruct(arg1?: A1, arg2?: A2, arg3?: A3): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2, arg3?: A3
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1, arg2?: A2, arg3?: A3
    ): void
}

export abstract class ArkCommonStruct4<T, A1, A2, A3, A4> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct4<S, A1, A2, A3, A4>, A1, A2, A3, A4>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void), arg?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ): void
}
