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

declare enum ButtonType {

    Capsule,
    Circle,
}

declare interface LabelStyle {

    maxLines?: number;

    //  error TS2551: Property 'dayFontSize' does not exist on type 'LabelStyle'.
    //  Did you mean 'maxFontSize'?
    // dayFontSize?: number;
}

declare interface ButtonOptions {

    type?: ButtonType;
}

interface ButtonInterface {

    (): ButtonAttribute;
}
declare class ButtonAttribute extends CommonMethod<ButtonAttribute> {

    type(value: ButtonType): ButtonAttribute;

    // fontColor(value: ResourceColor): ButtonAttribute;

    labelStyle(value: LabelStyle): ButtonAttribute;
}


declare const Button: ButtonInterface;

declare const ButtonInstance: ButtonAttribute;
