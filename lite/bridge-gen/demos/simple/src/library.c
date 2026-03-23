#include "stdint.h"
#include "stdio.h"

typedef struct vec2 {
    int32_t x;
    int32_t y;
} vec2;

typedef struct vec3 {
    int32_t x;
    int32_t y;
    int32_t z;
} vec3;

typedef struct NamedDot {
    const char* name;
    vec3 position;
} NamedDot;


typedef struct NamedDotMap {
    uint8_t dots_size;
    NamedDot dots[128];
} NamedDotMap;

uint8_t objects_size = 0;
NamedDotMap dots[128];

void name_dot_space_push(uint64_t idx, NamedDot dot)
{
    NamedDotMap* object = dots + idx;
    object->dots[object->dots_size++] = dot;
}
void name_dot_space_print(uint64_t idx)
{
    NamedDotMap* object = dots + idx;
    for (uint8_t ii = 0; ii < object->dots_size; ++ii) {
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
vec3 name_dot_space_gen_new_position(int32_t seed)
{
    return (vec3) { .x = 1, .y = 2, .z = 3 };
}
vec3 name_dot_space_add3(vec3 a, vec3 b)
{
    return (vec3)
    {
        .x = a.x = b.x,
        .y = a.y = b.y,
        .z = a.z = b.z,
    };
}
