/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Heavily inspired by node-gyp

/*
 * When this file is linked to a DLL, it sets up a delay-load hook that
 * intervenes when the DLL is trying to load the host executable
 * dynamically. Instead of trying to locate the .exe file it'll just
 * return a handle to the process image.
 *
 * This allows compiled addons to work when the host executable is renamed.
 */

#ifdef _MSC_VER

#pragma managed(push, off)

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>

#include <delayimp.h>
#include <string.h>


static FARPROC WINAPI load_exe_hook(unsigned int event, PDelayLoadInfo info) {
    if (event != dliNotePreLoadLibrary) {
        return NULL;
    }

    if (_stricmp(info->szDll, "node.exe") != 0) {
        // Case-insensitive comparision is necessary
        return NULL;
    }

    HMODULE thisModule = GetModuleHandle(NULL);
    return reinterpret_cast<FARPROC>(thisModule);
}

ExternC const PfnDliHook __pfnDliNotifyHook2 = load_exe_hook;

#pragma managed(pop)

#endif