#include "cxxapi.h"
#include <iostream>

int32_t Point::x() const {
    return _x;
}
int32_t Point::y() const {
    return _y;
}
Point* Point::create(int32_t x, int32_t y) {
    return new Point(x, y);
}

Printer* Printer::createPrinter() {
    return new Printer();
}
void Printer::print(const char* text) {
    std::cout << "LOG: " << text << ";" << std::endl;
}
