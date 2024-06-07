#include "load-library.h"
#include "arkoala-logging.h"

#if defined(KOALA_WINDOWS)

#include <windows.h>
// Here we need to find module where GetArkUINodeAPI()
// function is implemented.
void* FindModule()
{
    HMODULE result = nullptr;
    const char libname[] = "./native/ace_compatible_mock.dll";
    result = LoadLibraryA(libname);
    if (result) {
        return result;
    }
    LOG("Cannot find module!");
    return nullptr;
}
void* FindFunction(void* library, const char* name)
{
    return (void*)GetProcAddress(reinterpret_cast<HMODULE>(library), TEXT(name));
}

#elif defined(KOALA_OHOS) || defined(KOALA_LINUX) || defined(KOALA_MACOS)

#include <dlfcn.h>
void* FindModule()
{
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
}

void* FindFunction(void* library, const char* name)
{
    return dlsym(library, name);
}

#else

void* FindModule()
{
    return nullptr;
}

void* FindFunction(void* library, const char* name)
{
    return nullptr;
}

#endif