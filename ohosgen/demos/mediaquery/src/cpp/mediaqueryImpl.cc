#include "ohos_mediaquery.h"
#include <cstdlib>
#include <cstring>
#include <vector>
#include <string>

class FakeMediaQuery {};

OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle mediaquery_MediaQueryListener_constructImpl() {
    FakeMediaQuery* fake = new FakeMediaQuery();
    return (OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle)fake;
}
void mediaquery_MediaQueryListener_destructImpl(OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle thisPtr) {
}
void mediaquery_MediaQueryListener_onChangeImpl(OH_NativePointer thisPtr, const OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_) {
    OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryResult result = {
        .matches=true,
        .media=(OH_String) {
            .chars="hello",
            .length=5
        }
    };
    callback_->call(callback_->resource.resourceId, result);
}
void mediaquery_MediaQueryListener_offChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_) {
}
OH_Boolean mediaquery_MediaQueryListener_getMatchesImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String mediaquery_MediaQueryListener_getMediaImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListener GlobalScope_matchMediaSyncImpl(const OH_String* condition) {
    return {};
}
OH_UInt64 GlobalScope_mediaquery_testImpl(OH_UInt64 num) {
    return num * 2;
}
void GlobalScope_mediaquery_testPutStringImpl(
    const OH_String* x) {}
OH_String GlobalScope_mediaquery_testGetStringImpl() {
  return OH_String{"x", 1};
}

static const char *STRING_128 =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    "abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// 128 characters, 256B
static const char* STRING_128_UNICODE =
  "０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ";

OH_String GlobalScope_mediaquery_testGetString128Impl() {
  return OH_String{STRING_128, 128};
}

OH_String GlobalScope_mediaquery_testGetString128UnicodeImpl() {
  return OH_String{STRING_128_UNICODE, (int)strlen(STRING_128_UNICODE)};
}

OH_String GlobalScope_mediaquery_testConcatStringImpl(
    const OH_String* x, const OH_String* y) {
  char *buf = (char *)malloc(x->length + y->length + 1);
  memcpy(buf, x->chars, x->length);
  memcpy(buf + x->length, y->chars, y->length);
  buf[x->length + y->length] = 0;
  return OH_String{buf, x->length + y->length};
}

void parse_option(const OH_OHOS_MEDIAQUERY_mediaquery_Option* op) {
    OH_String src = op->src;
    std::string srcNative = std::string(src.chars);
    OH_Number dest = op->dest;
    int destNative = dest.i32;

    std::vector<std::string> strings;
    Array_String files = op->files;
    for (int i = 0; i < files.length; i++) {
        std::string fileNative = std::string(files.array[i].chars);
        strings.emplace_back(fileNative);
    }

    // Map_String_Number maps = op->maps;
    // for (int i = 0; i < maps.size; i++) {
    //     std::string mapkey = std::string(maps.keys[i].chars);
    //     int mapvalue = maps.values[i].i32;
    // }
}

void GlobalScope_mediaquery_optionArg1Impl(const OH_String* str, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op1) {
    std::string res = std::string(str->chars);
    parse_option(op1);

}
void GlobalScope_mediaquery_optionArg2Impl(const OH_String* str, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op1, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op2) {
    std::string res = std::string(str->chars);
    parse_option(op1);
    parse_option(op2);
}
void GlobalScope_mediaquery_optionArg3Impl(const OH_String* str, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op1, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op2, const OH_OHOS_MEDIAQUERY_mediaquery_Option* op3) {
    std::string res = std::string(str->chars);
    parse_option(op1);
    parse_option(op2);
    parse_option(op3);
}

void GlobalScope_mediaquery_optionPrimImpl(const OH_Number* num) {
    int res = num->i32;
}
