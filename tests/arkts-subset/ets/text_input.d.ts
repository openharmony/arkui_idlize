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

declare enum InputType {

    Normal,
    Number,
}

declare enum EnterKeyType {
    Go = 2,
    Search = 3,
    Send = 4,
    Next = 5,
    Done = 6,
    PREVIOUS = 7,
    NEW_LINE = 8,
  }

declare enum ContentType {

  USER_NAME = 0,
  PASSWORD = 1,
}

declare interface TextInputOptions {

    placeholder?: ResourceStr;

    text?: ResourceStr;

    //controller?: TextInputController;
}

interface TextInputInterface {

    (value?: TextInputOptions): TextInputAttribute;
}

declare class TextInputAttribute extends CommonMethod<TextInputAttribute> {

    type(value: InputType): TextInputAttribute;

    contentType(value: ContentType): TextInputAttribute;

    onEditChanged(callback: (isEditing: boolean) => void): TextInputAttribute;

    placeholderFont(value?: Font): TextInputAttribute;

    enterKeyType(value: EnterKeyType): TextInputAttribute;

}

declare const TextInput: TextInputInterface;

declare const TextInputInstance: TextInputAttribute;
