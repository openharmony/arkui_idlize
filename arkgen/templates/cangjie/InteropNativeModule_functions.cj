public static func _StringData(ptr: KPointer, data: Array<UInt8>, arg2: Int32): Unit {
    unsafe {
        let handle_1 = acquireArrayRawData(data)
        StringData(ptr, handle_1.pointer, arg2)
        releaseArrayRawData(handle_1)
    }
}
public static func _CheckArkoalaCallbackEvent(buffer: Array<UInt8>, bufferLength: Int32): Int32 {
    unsafe {
        let handle_0 = acquireArrayRawData(buffer)
        let result = CheckCallbackEvent(handle_0.pointer, bufferLength)
        releaseArrayRawData(handle_0);
        return result
    }
}