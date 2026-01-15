#include <cstdint>

class Point {
public:
    int32_t x() const;
    int32_t y() const;
    static Point* create(int32_t, int32_t);
private:
    int32_t _x;
    int32_t _y;
    Point(int32_t x, int32_t y): _x(x), _y(y) {}
};

class Printer {
public:
    void print(const char*);
    static Printer* createPrinter();
};
