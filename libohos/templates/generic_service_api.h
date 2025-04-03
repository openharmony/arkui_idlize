#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#include <stdint.h>
#define GENERIC_SERVICE_API_VERSION 1
enum GENERIC_SERVICE_APIKind {
    GENERIC_SERVICE_API_KIND = 14,
};

typedef struct ServiceLogger {
    void (*startGroupedLog)(int kind);
    void (*stopGroupedLog)(int kind);
    void (*appendGroupedLog)(int kind, const char* str);
    const char* (*getGroupedLog)(int kind);
    int (*needGroupedLog)(int kind);
} ServiceLogger;

typedef struct GenericServiceAPI {
    int32_t version;
    void (*setLogger)(const ServiceLogger* logger);
} GenericServiceAPI;
#endif