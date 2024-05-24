#include "arkoala_api.h"
#include "events.h"
#include "Interop.h"
#include "Deserializer.h"

extern const GENERATED_ArkUIEventsAPI* GetArkUiEventsAPI();

void impl_Test_TextPicker_OnAccept(uint8_t* valueArray, int32_t valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Ark_String arg1 = deserializer.readString();
    Ark_Number arg2 = deserializer.readNumber();
    GetArkUiEventsAPI()->getTextPickerEventsReceiver()->onAccept(nodeId, arg1, arg2);
}
KOALA_INTEROP_V2(Test_TextPicker_OnAccept, uint8_t*, uint32_t)