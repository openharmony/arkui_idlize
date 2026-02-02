
import { SerializerBase, DeserializerBase, } from "@koalaui/interop"

export interface DataView_ {}

export class LanglibDataView_SerializerImpl {
    public static write(buffer: SerializerBase, value: DataView_): void {
        // TBD: serialize DataView
        throw new Error("Not implemented")
    }
    public static read(buffer: DeserializerBase): DataView_ {
        // TBD: deserialize DataView
        throw new Error("Not implemented")
    }
}

