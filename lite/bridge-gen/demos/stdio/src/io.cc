#include "io.h"

const char* str(void* mem) {
    return reinterpret_cast<const char*>(mem);
}
void setb(char* mem, uint64_t idx, char b) {
    mem[idx] = b;
}

const char* getCWD() {
    char* mem = new char[1024];
    getcwd(mem, 1024);
    return mem;
}
