#pragma once

#if NAPI_INTEROP
#include "./platform/napi.h"
#elif ANI_INTEROP
#include "./platform/ani.h"
#else
#error "NO INTEROP SELECTED"
#endif
