/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare type AnimationRange<T> = [from: T, to: T];

declare interface ClickEvent extends BaseEvent {

    displayX: number;

    displayY: number;
}

declare interface UICommonEvent {

    setOnClick(callback: Callback<ClickEvent> | undefined): void;
}

declare enum SheetSize {
    MEDIUM,
    LARGE,
    FIT_CONTENT = 2,
}

declare interface BindOptions {
    backgroundColor?: ResourceColor;
}

declare interface SheetOptions extends BindOptions {
    detents?: [(SheetSize | Length), (SheetSize | Length)?, (SheetSize | Length)?];
}

declare class CommonMethod<T> {

    constructor();

    width(value: Length): T;

    height(value: Length): T;

    //bindSheet(isShow: boolean, builder: CustomBuilder, options?: SheetOptions): T;
}

declare interface Rectangle {

    x?: Length;

    y?: Length;

    width?: Length;

    height?: Length;
}

declare class CommonAttribute extends CommonMethod<CommonAttribute> {}

declare class CommonShapeMethod<T> extends CommonMethod<T> {

    constructor();
}

declare class ScrollableCommonMethod<T> extends CommonMethod<T> {}

declare module 'commonEvent' {
    module 'commonEvent' {
        // @ts-ignore
        export { UICommonEvent };
    }
}

declare module 'commonAttribute'{
    module 'commonAttribute' {
        // @ts-ignore
        export { CommonAttribute };
    }
}
