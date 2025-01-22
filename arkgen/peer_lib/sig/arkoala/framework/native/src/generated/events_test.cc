#define KOALA_INTEROP_MODULE TestNativeModule

#include "events.h"
#include "common-interop.h"
#include "Serializers.h"
#include "arkoala_api_generated.h"
#include "callbacks.h"

const GENERATED_ArkUIAnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);

namespace Generated {
    extern const GENERATED_ArkUIEventsAPI* GetArkUiEventsAPI();
}

static const GENERATED_ArkUIFullNodeAPI* GetFullImpl() {
    return reinterpret_cast<const GENERATED_ArkUIFullNodeAPI*>(
        GetAnyImpl(static_cast<int>(GENERATED_Ark_APIVariantKind::GENERATED_FULL),
        GENERATED_ARKUI_FULL_API_VERSION, nullptr));
}

void impl_Test_SetEventsApi() {
    GetFullImpl()->setArkUIEventsAPI(Generated::GetArkUiEventsAPI());
}
KOALA_INTEROP_V0(Test_SetEventsApi)

void impl_Test_TextPicker_OnAccept(KByte* valueArray, KInt valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Ark_String arg1 = deserializer.readString();
    Ark_Number arg2 = deserializer.readNumber();
    GetFullImpl()->getEventsAPI()->getTextPickerEventsReceiver()->onAccept(nodeId, arg1, arg2);
}
KOALA_INTEROP_V2(Test_TextPicker_OnAccept, KByte*, KUInt)

void impl_Test_List_OnScrollVisibleContentChange(KByte* valueArray, KInt valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Ark_VisibleListContentInfo start = deserializer.readVisibleListContentInfo();
    Ark_VisibleListContentInfo end = deserializer.readVisibleListContentInfo();
    GetFullImpl()->getEventsAPI()->getListEventsReceiver()->onScrollVisibleContentChange(nodeId, start, end);
}
KOALA_INTEROP_V2(Test_List_OnScrollVisibleContentChange, KByte*, KUInt)

void impl_Test_Common_OnChildTouchTest(KByte* valueArray, KInt valueLength) {
    Deserializer deserializer(valueArray, valueLength);
    Ark_Int32 nodeId = deserializer.readInt32();
    Array_TouchTestInfo param;
    deserializer.readInt8();
    param.length = deserializer.readInt32();
    deserializer.resizeArray<std::decay<decltype(param)>::type, std::decay<decltype(*param.array)>::type>(&param, param.length);
    for (int i = 0; i < param.length; i++) {
        param.array[i] = deserializer.readTouchTestInfo();
    }
    GetFullImpl()->getEventsAPI()->getCommonMethodEventsReceiver()->onChildTouchTest(nodeId, param);
}
KOALA_INTEROP_V2(Test_Common_OnChildTouchTest, KByte*, KUInt)

KNativePointer impl_TestGetManagedCaller(KInt kind) {
    return getManagedCallbackCaller(static_cast<CallbackKind>(kind));
}
KOALA_INTEROP_1(TestGetManagedCaller, KNativePointer, KInt)

KNativePointer impl_TestGetManagedCallerSync(KInt kind) {
    return getManagedCallbackCallerSync(static_cast<CallbackKind>(kind));
}
KOALA_INTEROP_1(TestGetManagedCallerSync, KNativePointer, KInt)

KNativePointer impl_TestGetManagedHolder() {
    return reinterpret_cast<KNativePointer>(holdManagedCallbackResource);
}
KOALA_INTEROP_0(TestGetManagedHolder, KNativePointer)

KNativePointer impl_TestGetManagedReleaser() {
    return reinterpret_cast<KNativePointer>(releaseManagedCallbackResource);
}
KOALA_INTEROP_0(TestGetManagedReleaser, KNativePointer)

void impl_TestSetArkoalaCallbackCaller() {
    setCallbackCaller(deserializeAndCallCallback);
}
KOALA_INTEROP_V0(TestSetArkoalaCallbackCaller)

void impl_TestSetArkoalaCallbackCallerSync() {
    setCallbackCallerSync((Callback_Caller_Sync_t)deserializeAndCallCallbackSync);
}
KOALA_INTEROP_V0(TestSetArkoalaCallbackCallerSync)
