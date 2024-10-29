#include "common-interop.h"

void impl_CallCallback(KInt kind, KByte* thisArray, KInt thisLength) {
    return;
}
KOALA_INTEROP_V3(CallCallback, KInt, KByte*, KInt)

void impl_CallCallbackResourceHolder(KInt kind, KByte* thisArray, KInt resourceId) {
    return;
}
KOALA_INTEROP_V3(CallCallbackResourceHolder, KInt, KByte*, KInt)

void impl_CallCallbackResourceReleaser(KInt kind, KByte* thisArray, KInt resourceId) {
    return;
}
KOALA_INTEROP_V3(CallCallbackResourceReleaser, KInt, KByte*, KInt)
