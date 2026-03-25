/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

interface GridItemInterface {
    (): GridItemAttribute;
}

declare class GridItemAttribute extends CommonMethod<GridItemAttribute> {
    rowStart(value: number): GridItemAttribute;
    rowEnd(value: number): GridItemAttribute;
    columnStart(value: number): GridItemAttribute;
    columnEnd(value: number): GridItemAttribute;
    forceRebuild(value: boolean): GridItemAttribute;
    selectable(value: boolean): GridItemAttribute;
    selected(value: boolean): GridItemAttribute;
    onSelect(event: (isSelected: boolean) => void): GridItemAttribute;
}

declare const GridItem: GridItemInterface
declare const GridItemInstance: GridItemAttribute;
