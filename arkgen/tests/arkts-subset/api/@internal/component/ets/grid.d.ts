/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
// declare interface GridLayoutOptions {
//     regularSize: [number, number];
//     irregularIndexes?: number[];
//     onGetIrregularSizeByIndex?: (index: number) => [number, number]
//     onGetRectByIndex?: (index: number) => [number, number, number, number]
// }

interface GridInterface {
    // (scroller?: Scroller, layoutOptions?: GridLayoutOptions): GridAttribute;
    (): GridAttribute;
}

declare class GridAttribute extends ScrollableCommonMethod<GridAttribute> {
    columnsTemplate(value: string): GridAttribute;
    rowsTemplate(value: string): GridAttribute;
    onScrollIndex(event: (first: number, last: number) => void): GridAttribute;
}

//declare constGrid: GridInterface;
//declare constGridInstance: GridAttribute;