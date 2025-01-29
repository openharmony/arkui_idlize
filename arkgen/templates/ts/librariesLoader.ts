class NativeString extends NativeStringBase {
    constructor(ptr: KPointer) {
        super(ptr)
    }
    protected bytesLength(): int32 {
        return InteropNativeModule._StringLength(this.ptr)
    }
    protected getData(data: Uint8Array): void {
        withByteArray(data, Access.WRITE, (dataPtr: KUint8ArrayPtr) => {
            InteropNativeModule._StringData(this.ptr, dataPtr, data.length)
        })
    }
    close(): void {
        InteropNativeModule._InvokeFinalizer(this.ptr, InteropNativeModule._GetStringFinalizer())
        this.ptr = nullptr
    }
}

providePlatformDefinedData({
    nativeString(ptr: KPointer): NativeStringBase { return new NativeString(ptr) },
    nativeStringArrayDecoder(): ArrayDecoder<NativeStringBase> { throw new Error("Not implemented") },
    callbackRegistry(): CallbackRegistry | undefined { return undefined }
})
