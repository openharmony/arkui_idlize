#pragma once
#include <string>
#include <stdio.h>
#include <stdint.h>

#if defined(KOALA_USE_ARK_VM) && defined(KOALA_OHOS)
#include "oh_sk_log.h"
#define LOG(msg) OH_SK_LOG_INFO(msg);
#define LOGI(msg, ...) OH_SK_LOG_INFO_A(msg, ##__VA_ARGS__);
#define LOGE(msg, ...) OH_SK_LOG_ERROR_A(msg, ##__VA_ARGS__);
#else
#define LOG(msg) fprintf(stdout, msg "\n");
#define LOGI(msg, ...) fprintf(stdout, msg "\n", ##__VA_ARGS__);
#define LOGE(msg, ...) fprintf(stderr, msg "\n", ##__VA_ARGS__);
#endif
