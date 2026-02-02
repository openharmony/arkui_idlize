
import { SerializerBase, DeserializerBase, } from "@koalaui/interop"


export class LanglibDataView_SerializerImpl {
    public static write(buffer: SerializerBase, value: DataView): void {
        // TBD: serialize DataView
    }
    public static read(buffer: DeserializerBase): DataView {
        // TBD: deserialize DataView
        let value : DataView = new DataView(new ArrayBuffer(1))
        return value
    }
}

