#include <api.h>

extern "C" _GENERATED_Api* _getAPI() {
    static _GENERATED_Api api {};
    return &api;
}
