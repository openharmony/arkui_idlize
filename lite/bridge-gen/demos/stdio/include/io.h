#pragma once

#include <stdio.h>
#include <stdint.h>
#include <unistd.h>

extern "C" const char* str(void*);
extern "C" void setb(char*, uint64_t, char);
extern "C" const char* getCWD();
