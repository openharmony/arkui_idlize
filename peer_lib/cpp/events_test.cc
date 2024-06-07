#include "arkoala_api.h"
#include "events.h"
#include "Interop.h"
#include "Serializers.h"

extern const GENERATED_ArkUIEventsAPI* GetArkUiEventsAPI();

void impl_Test_TextPicker_OnAccept(uint8_t* valueArray, int32_t valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Ark_String arg1 = deserializer.readString();
    Ark_Number arg2 = deserializer.readNumber();
    GetArkUiEventsAPI()->getTextPickerEventsReceiver()->onAccept(nodeId, arg1, arg2);
}
KOALA_INTEROP_V2(Test_TextPicker_OnAccept, uint8_t*, uint32_t)

void impl_Test_List_OnScrollVisibleContentChange(uint8_t* valueArray, int32_t valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    VisibleListContentInfo start = deserializer.readVisibleListContentInfo();
    VisibleListContentInfo end = deserializer.readVisibleListContentInfo();
    GetArkUiEventsAPI()->getListEventsReceiver()->onScrollVisibleContentChange(nodeId, start, end);
}
KOALA_INTEROP_V2(Test_List_OnScrollVisibleContentChange, uint8_t*, uint32_t)

void impl_Test_Common_OnChildTouchTest(uint8_t* valueArray, int32_t valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Array_TouchTestInfo param;
    const auto runtimeType = deserializer.readInt8();
    param.length = deserializer.readInt32();
    deserializer.resizeArray<std::decay<decltype(param)>::type, std::decay<decltype(*param.array)>::type>(&param, param.length);
    for (int i = 0; i < param.length; i++) {
        param.array[i] = deserializer.readTouchTestInfo();
    }
    GetArkUiEventsAPI()->getCommonEventsReceiver()->onChildTouchTest(nodeId, param);
}
KOALA_INTEROP_V2(Test_Common_OnChildTouchTest, uint8_t*, uint32_t)
