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

declare interface RowOptions {
    space?: string | number;
}
interface RowInterface {
    (options?: RowOptions): RowAttribute;
}

declare class RowAttribute extends CommonMethod<RowAttribute> {
    alignItems(value: VerticalAlign): RowAttribute;
    justifyContent(value: FlexAlign): RowAttribute;
    pointLight(value: PointLightStyle): RowAttribute;
    reverse(isReversed: Optional<boolean>): RowAttribute;
}
declare const Row: RowInterface;
declare const RowInstance: RowAttribute;
