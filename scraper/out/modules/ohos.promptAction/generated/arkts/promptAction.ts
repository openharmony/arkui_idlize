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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { extractors } from "#handwritten"
import { TypeChecker, OHOS_PROMPTACTIONNativeModule } from "./ohos.promptAction.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { KeyboardAvoidMode } from "@ohos.arkui.UIContext"
export class LevelOrderInternal {
    public static fromPtr(ptr: KPointer): LevelOrder {
        return new LevelOrder(ptr)
    }
}
export class LevelOrder implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, LevelOrder.getFinalizer())
    }
    constructor() {
        this(LevelOrder.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_PROMPTACTIONNativeModule._LevelOrder_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_PROMPTACTIONNativeModule._LevelOrder_getFinalizer()
    }
    static clamp_serialize(order: number): LevelOrder {
        const retval  = OHOS_PROMPTACTIONNativeModule._LevelOrder_clamp(order)
        const obj : LevelOrder = extractors.fromLevelOrderPtr(retval)
        return obj
    }
    public static clamp(order: number): LevelOrder {
        const order_casted = order as (number)
        return LevelOrder.clamp_serialize(order_casted)
    }
    public getOrder(): number {
        return this.getOrder_serialize()
    }
    getOrder_serialize(): number {
        const retval  = OHOS_PROMPTACTIONNativeModule._LevelOrder_getOrder(this.peer!.ptr)
        return retval
    }
}
export enum LevelMode {
    OVERLAY = 0,
    EMBEDDED = 1
}
export enum ImmersiveMode {
    DEFAULT = 0,
    EXTEND = 1
}
export default promptAction
export namespace promptAction {
    export class CommonControllerInternal {
        public static fromPtr(ptr: KPointer): promptAction.CommonController {
            return new promptAction.CommonController(ptr)
        }
    }
    export class CommonController implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, CommonController.getFinalizer())
        }
        constructor() {
            this(CommonController.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_PROMPTACTIONNativeModule._promptAction_CommonController_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_PROMPTACTIONNativeModule._promptAction_CommonController_getFinalizer()
        }
        public close(): void {
            this.close_serialize()
            return
        }
        close_serialize(): void {
            OHOS_PROMPTACTIONNativeModule._promptAction_CommonController_close(this.peer!.ptr)
        }
    }
    export interface ShowToastOptions {
        message: string | object;
        duration?: number;
        bottom?: string | number;
        showMode?: promptAction.ToastShowMode;
        alignment?: object;
        offset?: object;
        backgroundColor?: object;
        textColor?: object;
        backgroundBlurStyle?: object;
        shadow?: object | object;
        enableHoverMode?: boolean;
        hoverModeArea?: object;
    }
    export enum ToastShowMode {
        DEFAULT = 0,
        TOP_MOST = 1,
        SYSTEM_TOP_MOST = 2
    }
    export interface Button {
        text: string | object;
        color: string | object;
        primary?: boolean;
    }
    export type PromptActionSingleButton = [
        promptAction.Button
    ]
    export type PromptActionDoubleButtons = [
        promptAction.Button,
        promptAction.Button | undefined
    ]
    export type PromptActionTripleButtons = [
        promptAction.Button,
        promptAction.Button | undefined,
        promptAction.Button | undefined
    ]
    export type PromptActionQuadrupleButtons = [
        promptAction.Button,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined
    ]
    export type PromptActionQuintupleButtons = [
        promptAction.Button,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined
    ]
    export type PromptActionSextupleButtons = [
        promptAction.Button,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined,
        promptAction.Button | undefined
    ]
    export interface ShowDialogSuccessResponse {
        index: number;
    }
    export interface ShowDialogOptions {
        title?: string | object;
        message?: string | object;
        buttons?: Array<promptAction.Button>;
        maskRect?: object;
        alignment?: object;
        offset?: object;
        showInSubWindow?: boolean;
        isModal?: boolean;
        backgroundColor?: object;
        backgroundBlurStyle?: object;
        backgroundBlurStyleOptions?: object;
        backgroundEffect?: object;
        shadow?: object | object;
        enableHoverMode?: boolean;
        hoverModeArea?: object;
        onDidAppear?: (() => void);
        onDidDisappear?: (() => void);
        onWillAppear?: (() => void);
        onWillDisappear?: (() => void);
        levelMode?: LevelMode;
        levelUniqueId?: number;
        immersiveMode?: ImmersiveMode;
        levelOrder?: LevelOrder;
    }
    export interface BaseDialogOptions {
        maskRect?: object;
        alignment?: object;
        offset?: object;
        showInSubWindow?: boolean;
        isModal?: boolean;
        autoCancel?: boolean;
        transition?: object;
        dialogTransition?: object;
        maskTransition?: object;
        maskColor?: object;
        onWillDismiss?: ((value0: object) => void);
        onDidAppear?: (() => void);
        onDidDisappear?: (() => void);
        onWillAppear?: (() => void);
        onWillDisappear?: (() => void);
        keyboardAvoidMode?: KeyboardAvoidMode;
        enableHoverMode?: boolean;
        hoverModeArea?: object;
        backgroundBlurStyleOptions?: object;
        backgroundEffect?: object;
        keyboardAvoidDistance?: object;
        levelMode?: LevelMode;
        levelUniqueId?: number;
        immersiveMode?: ImmersiveMode;
        levelOrder?: LevelOrder;
        focusable?: boolean;
    }
    export interface CustomDialogOptions extends promptAction.BaseDialogOptions {
        builder: object;
        backgroundColor?: object;
        cornerRadius?: object | object;
        width?: object;
        height?: object;
        borderWidth?: object | object;
        borderColor?: object | object;
        borderStyle?: object | object;
        shadow?: object | object;
        backgroundBlurStyle?: object;
    }
    export type DialogOptionsCornerRadius = object | object;
    export type DialogOptionsBorderWidth = object | object;
    export type DialogOptionsBorderColor = object | object;
    export type DialogOptionsBorderStyle = object | object;
    export type DialogOptionsShadow = object | object;
    export interface DialogOptions extends promptAction.BaseDialogOptions {
        backgroundColor?: object;
        cornerRadius?: promptAction.DialogOptionsCornerRadius;
        width?: object;
        height?: object;
        borderWidth?: promptAction.DialogOptionsBorderWidth;
        borderColor?: promptAction.DialogOptionsBorderColor;
        borderStyle?: promptAction.DialogOptionsBorderStyle;
        shadow?: promptAction.DialogOptionsShadow;
        backgroundBlurStyle?: object;
    }
    export interface ActionMenuSuccessResponse {
        index: number;
    }
    export interface ActionMenuOptions {
        title?: string | object;
        buttons: promptAction.PromptActionSingleButton | promptAction.PromptActionDoubleButtons | promptAction.PromptActionTripleButtons | promptAction.PromptActionQuadrupleButtons | promptAction.PromptActionQuintupleButtons | promptAction.PromptActionSextupleButtons;
        showInSubWindow?: boolean;
        isModal?: boolean;
        levelMode?: LevelMode;
        levelUniqueId?: number;
        immersiveMode?: ImmersiveMode;
    }
    export class DialogControllerInternal {
        public static fromPtr(ptr: KPointer): promptAction.DialogController {
            return new promptAction.DialogController(ptr)
        }
    }
    export class DialogController extends promptAction.CommonController implements MaterializedBase {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(DialogController.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_PROMPTACTIONNativeModule._promptAction_DialogController_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_PROMPTACTIONNativeModule._promptAction_DialogController_getFinalizer()
        }
    }
}
