#include "test_name_collision.h"
#include "DeserializerBase.h"
#include <iostream>

void GlobalScope_resizeImpl(const OH_TEST_NAME_COLLISION_Size* size) {
    std::cout << "resize(" << size->height << "x" << size->width << ")" << std::endl;
}
void GlobalScope_image_resizeImpl(const OH_TEST_NAME_COLLISION_image_Size* size) {
    std::cout << "image_resize(" << size->height << "x" << size->width << ")" << std::endl;
}
void GlobalScope_window_resizeImpl(const OH_TEST_NAME_COLLISION_window_Size* size) {
    std::string height, width;
    WriteToString(&height, &size->height);
    WriteToString(&width, &size->width);
    std::cout << "window_resize(" << height << "x" << width << ")" << std::endl;
}

// unused

void GlobalScope_resizeImageImpl(const OH_TEST_NAME_COLLISION_image_Size* size) {
}
void GlobalScope_resizeWindowImpl(const OH_TEST_NAME_COLLISION_window_Size* size) {
}
