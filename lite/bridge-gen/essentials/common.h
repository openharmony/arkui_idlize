#pragma once

#ifndef PlatformEnvType
#define PlatformEnvType int
#endif

template <typename T>
struct BridgeConvertor {
    using PlatformType = T;
    static T toBridgeType(PlatformEnvType, PlatformType) = delete;
    static PlatformType fromBridgeType(PlatformEnvType, T) = delete;
    static void cleanup(T) {};
};
