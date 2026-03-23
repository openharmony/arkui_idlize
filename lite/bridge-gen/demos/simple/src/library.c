#include "stdint.h"
#include "stdio.h"

typedef struct Vec2 {
    int32_t x;
    int32_t y;
} Vec2;

typedef struct Vec3 {
    int32_t x;
    int32_t y;
    int32_t z;
} Vec3;

typedef struct NamedDot {
    const char* name;
    Vec3 position;
} NamedDot;


typedef struct NamedDotMap {
    uint8_t dotsSize;
    NamedDot dots[128];
} NamedDotMap;

uint8_t g_objectsSize = 0;
NamedDotMap g_dots[128];

void NameDotSpacePush(uint64_t idx, NamedDot dot)
{
    NamedDotMap* object = g_dots + idx;
    object->dots[object->dotsSize++] = dot;
}
void NameDotSpacePrint(uint64_t idx)
{
    NamedDotMap* object = g_dots + idx;
    for (uint8_t ii = 0; ii < object->dotsSize; ++ii) {
        NamedDot* dot = object->dots + ii;
        printf(
            "DOT %s (%d, %d, %d)\n",
            dot->name,
            dot->position.x,
            dot->position.y,
            dot->position.z
        );
    }
}
Vec3 NameDotSpaceGenNewPosition(int32_t seed)
{
    return (Vec3) { .x = 1, .y = 2, .z = 3 };
}
Vec3 NameDotSpaceAdd3(Vec3 a, Vec3 b)
{
    return (Vec3)
    {
        .x = a.x = b.x,
        .y = a.y = b.y,
        .z = a.z = b.z,
    };
}
