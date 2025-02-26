#include "mediaquery.h"

class FakeMediaQuery {};

OH_MEDIAQUERY_MediaQueryListenerHandle MediaQueryListener_constructImpl() {
    FakeMediaQuery* fake = new FakeMediaQuery();
    return (OH_MEDIAQUERY_MediaQueryListenerHandle)fake;
}
void MediaQueryListener_destructImpl(OH_MEDIAQUERY_MediaQueryListenerHandle thiz) {
}
void MediaQueryListener_onChangeImpl(OH_NativePointer thisPtr, const MEDIAQUERY_Callback_MediaQueryResult_Void* callback_) {
    OH_MEDIAQUERY_MediaQueryResult result = {
        .matches=true,
        .media=(OH_String) {
            .chars="hello",
            .length=5
        }
    };
    callback_->call(callback_->resource.resourceId, result);
}
void MediaQueryListener_offChangeImpl(OH_NativePointer thisPtr, const Opt_MEDIAQUERY_Callback_MediaQueryResult_Void* callback_) {
}
OH_Boolean MediaQueryListener_getMatchesImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String MediaQueryListener_getMediaImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_NativePointer GlobalScope_mediaquery_matchMediaSyncImpl(const OH_String* condition) {
    return {};
}
OH_UInt64 GlobalScope_mediaquery_ohos_mediaquery_testImpl(OH_UInt64 num) {
    return num * 2;
}