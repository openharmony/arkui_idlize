package langlib;

import koalaui.interop.SerializerBase
import koalaui.interop.DeserializerBase

public interface DataView_ {
}

private class DataView_Impl : DataView_ {
}

public class LanglibDataView_SerializerImpl {

    companion object {

        public fun write(buffer: SerializerBase, value: DataView_) {
            // TBD: serialize DataView
        }
        public fun  read(buffer: DeserializerBase): DataView_ {
            // TBD: deserialize DataView
            return DataView_Impl()
        }
    }
}

