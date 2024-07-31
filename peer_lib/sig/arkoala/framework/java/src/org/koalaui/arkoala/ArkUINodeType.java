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
package org.koalaui.arkoala;

// TODO: add generation or update according GENERATED_Ark_NodeType
public class ArkUINodeType {
    public static final ArkUINodeType List = new ArkUINodeType(10);
    public static final ArkUINodeType Button = new ArkUINodeType(13);
    public static final ArkUINodeType Column = new ArkUINodeType(16);
    public static final ArkUINodeType Web = new ArkUINodeType(22);
    public static final ArkUINodeType Root = new ArkUINodeType(30);
    public static final ArkUINodeType ComponentRoot = new ArkUINodeType(31);
    public static final ArkUINodeType Blank = new ArkUINodeType(43);

    public int value;

    private ArkUINodeType(int value) {
        this.value = value;
    }
}
