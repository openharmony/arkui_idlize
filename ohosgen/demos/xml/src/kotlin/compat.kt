package xmldemo

import koalaui.interop.checkEvents
import koalaui.interop.InteropNativeModule
import koalaui.interop.NativeBuffer
import ohos.xml.INTERNAL.registerOhosXmlApiHandler

public fun encodeText(text: String): NativeBuffer {
    val encodedString = text.encodeToByteArray().toUByteArray()
    val buffer = NativeBuffer((encodedString.size + 1).toLong())
    InteropNativeModule._CopyArray(buffer.data, (encodedString.size + 1).toLong(), encodedString)
    return buffer;
}

public fun init() {
    registerOhosXmlApiHandler()
}

public fun pullEvents() {
    checkEvents()
}
