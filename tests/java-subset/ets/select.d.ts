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

declare interface SelectOption {
  value: ResourceStr;
  icon?: ResourceStr;
  //~symbolIcon?: SymbolGlyphModifier;
}

declare interface MenuItemConfiguration extends CommonConfiguration<MenuItemConfiguration> {

    value: ResourceStr;

    icon?: ResourceStr;

    triggerSelect(index: number, value: string): void;
}

interface SelectInterface {
  (options: Array<SelectOption>): SelectAttribute;
}

declare class SelectAttribute extends CommonMethod<SelectAttribute> {

    //~menuItemContentModifier(modifier: ContentModifier<MenuItemConfiguration>): SelectAttribute;
}

declare const Select: SelectInterface;

declare const SelectInstance: SelectAttribute;
