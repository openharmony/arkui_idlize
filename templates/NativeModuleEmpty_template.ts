type KLong = number

export class NativeModuleEmptyIntegrated implements NativeModuleIntegrated {
%GENERATED_EMPTY_METHODS%
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void {
        throw new Error("_SetCallbackDispatcher")
    }
    _CleanCallbackDispatcher(): void {
        throw new Error("_CleanCallbackDispatcher")
    }
}

export class NativeModuleEmpty extends NativeModuleEmptyIntegrated implements NativeModule {}
