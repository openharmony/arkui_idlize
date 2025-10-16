package langlib;

import koalaui.interop.SerializerBase
import koalaui.interop.DeserializerBase

public interface DataView {
}

private class DataViewImpl : DataView {
}

public class LanglibDataViewSerializerImpl {

    companion object {

        public fun write(buffer: SerializerBase, value: DataView) {
            // TBD: serialize DataView
        }
        public fun  read(buffer: DeserializerBase): DataView {
            // TBD: deserialize DataView
            return DataViewImpl()
        }
    }
}

