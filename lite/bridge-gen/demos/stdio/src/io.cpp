/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#include "io.h"

const char* Str(void* mem)
{
    return reinterpret_cast<const char*>(mem);
}
void SetB(char* mem, uint64_t idx, char b)
{
    mem[idx] = b;
}

const char* GetCwd()
{
    char* mem = new char[PATH_BUFFER_SIZE];
    getcwd(mem, PATH_BUFFER_SIZE);
    return mem;
}
