#pragma once

#if defined(KOALA_WINDOWS)
#define IDLIZE_API_EXPORT __declspec(dllexport)
#else
#define IDLIZE_API_EXPORT __attribute__((visibility("default")))
#endif

#define EXTERN_C extern "C"