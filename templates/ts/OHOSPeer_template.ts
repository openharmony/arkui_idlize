import { int32 } from "@koalaui/common"
import { KPointer, pointer } from "@koalaui/interop"
import { RuntimeType, runtimeType, unsafeCast } from "./SerializerBase"
import { Serializer } from "%SERIALIZER_PATH%"

type Finalizable = { ptr: pointer }

%PEER_CONTENT%
