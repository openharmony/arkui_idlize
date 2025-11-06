#include "test_name_collision.h"
#include "DeserializerBase.h"
#include "oh_common.h"
#include <iostream>

void main_resizeImpl(const OH_TEST_NAME_COLLISION_main_Size* size) {
    std::cout << "resize(" << DumpOHNumber(size->height) << "x" << DumpOHNumber(size->width) << ")" << std::endl;
}
void main_integer_resizeImpl(const OH_TEST_NAME_COLLISION_main_integer_Size* size) {
    std::cout << "integer_resize(" << size->height << "x" << size->width << ")" << std::endl;
}
void addon_floating_resizeImpl(const OH_TEST_NAME_COLLISION_addon_floating_Size* size) {
    std::cout << "floating_resize(" << size->height << "x" << size->width << ")" << std::endl;
}

// unused

void main_resizeIntegerImpl(const OH_TEST_NAME_COLLISION_main_integer_Size* size) {
}
void main_resizeFloatingImpl(const OH_TEST_NAME_COLLISION_addon_floating_Size* size) {
}
