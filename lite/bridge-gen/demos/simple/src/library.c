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

typedef struct named_dot {
    const char* name;
    vec3 position;
} named_dot;


typedef struct named_dot_map {
    uint8_t dots_size;
    named_dot dots[128];
} named_dot_map;

uint8_t objects_size = 0;
named_dot_map dots[128];

void name_dot_space_push(uint64_t idx, named_dot dot) {
    named_dot_map* object = dots + idx;
    object->dots[object->dots_size++] = dot;
}
void name_dot_space_print(uint64_t idx) {
    named_dot_map* object = dots + idx;
    for (uint8_t ii = 0; ii < object->dots_size; ++ii) {
        named_dot* dot = object->dots + ii;
        printf(
            "DOT %s (%d, %d, %d)\n",
            dot->name,
            dot->position.x,
            dot->position.y,
            dot->position.z
        );
    }
}
vec3 name_dot_space_gen_new_position(int32_t seed) {
    return (vec3) { .x = 1, .y = 2, .z = 3 };
}
vec3 name_dot_space_add3(vec3 a, vec3 b) {
    return (vec3) {
        .x = a.x = b.x,
        .y = a.y = b.y,
        .z = a.z = b.z,
    };
}
