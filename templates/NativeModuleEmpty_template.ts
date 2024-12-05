type KLong = number

export class NativeModuleEmptyIntegrated implements NativeModuleIntegrated {
    _ComponentRoot_construct(id: int32, flags: int32): KPointer {
        console.log("_ComponentRoot_construct")
        return -1
    }
%GENERATED_EMPTY_METHODS%
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void {
        throw new Error("_SetCallbackDispatcher")
    }
    _CleanCallbackDispatcher(): void {
        throw new Error("_CleanCallbackDispatcher")
    }
}

export class NativeModuleEmpty extends NativeModuleEmptyIntegrated implements NativeModule {}
