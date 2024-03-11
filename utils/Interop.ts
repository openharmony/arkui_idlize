export type KStringPtr = string | null
export type int32 = number

export interface NativeModule {
    _ButtonAttribute_typeImpl(value: int32): void;
    _ButtonAttribute_stateEffectImpl(value: int32): void;
    _ButtonAttribute_fontFamilyImpl(valueArray: Uint8Array, valueSize: int32): void;
    _ButtonAttribute_labelStyleImpl(valueArray: Uint8Array, valueSize: int32): void;
    _ButtonAttribute_fontSizeImpl(valueArray: Uint8Array, valueSize: int32): void;
    _ButtonAttribute_fontStyleImpl(value: int32): void;
    _ButtonAttribute_fontColorImpl(valueArray: Uint8Array, valueSize: int32): void;
    _ButtonAttribute_fontWeightImpl(valueArray: Uint8Array, valueSize: int32): void;
}

// TODO: generate me.
export class ArkComponentAttributes {
}
export class ArkComponentPeer {
    applyAttributes(attrs: ArkComponentAttributes): void {

    }
}

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    theModule = require("nativeModule") as NativeModule
    return theModule
}