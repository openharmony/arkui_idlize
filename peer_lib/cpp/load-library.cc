#include "load-library.h"
#include "arkoala-logging.h"

#if defined(KOALA_WINDOWS)

#include <windows.h>
// Here we need to find module where GetArkAnyAPI()
// function is implemented.
void* FindModule()
{
#if KOALA_USE_LIBACE
    HMODULE result = nullptr;
    const char libname[] = "./native/ace_compatible_mock.dll";
    result = LoadLibraryA(libname);
    if (result) {
        return result;
    }
    LOG("Cannot find module!");
    return nullptr;
#else
     return (void*)1;
#endif
}
extern "C" void* GENERATED_GetArkAnyAPI(int kind, int version);

void* FindFunction(void* library, const char* name)
{
#if KOALA_USE_LIBACE
    return (void*)GetProcAddress(reinterpret_cast<HMODULE>(library), TEXT(name));
#else
    return (void*)&GENERATED_GetArkAnyAPI;
#endif
}

#elif defined(KOALA_OHOS) || defined(KOALA_LINUX) || defined(KOALA_MACOS)

#include <dlfcn.h>
void* FindModule()
{
#if KOALA_USE_LIBACE
#if defined(KOALA_OHOS)
    const char libname[] = "/system/lib64/module/libace_compatible_mock.so";
#else
    const char libname[] = "./native/libace_compatible_mock.so";
#endif
    void* result = dlopen(libname, RTLD_LAZY | RTLD_LOCAL);
    if (result) {
        return result;
    }
    LOGE("Cannot load libace: %s", dlerror());
    return nullptr;
#else
    return (void*)1;
#endif
}

extern "C" void* GENERATED_GetArkAnyAPI(int kind, int version);
void* FindFunction(void* library, const char* name)
{
#if KOALA_USE_LIBACE
    return dlsym(library, name);
#else
    return (void*)&GENERATED_GetArkAnyAPI;
#endif
}

#else

#error "Unknown platform"

#endif