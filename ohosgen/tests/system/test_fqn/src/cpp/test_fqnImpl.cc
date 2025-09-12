#include "test_fqn.h"
#include "oh_common.h"
#include <iostream>

void main_resizeImpl(OH_TEST_FQN_Sizes* arg) {
    std::cout << "resize(numSize=" << DumpOHNumber(arg->numSize.numWidth) << "x" << DumpOHNumber(arg->numSize.numHeight)
              << ", intSize=" << arg->intSize.intWidth << "x" << arg->intSize.intHeight
              << ", floatSize=" << arg->floatSize.floatWidth << "x" << arg->floatSize.floatHeight
              << ")" << std::endl;
}

void main_resize3Impl(OH_TEST_FQN_main_Size* numSize, OH_TEST_FQN_deps_Size* intSize, OH_TEST_FQN_deps_fp_Size* floatSize) {
    std::cout << "resize3(numSize=" << DumpOHNumber(numSize->numWidth) << "x" << DumpOHNumber(numSize->numHeight)
        << ", intSize=" << intSize->intWidth << "x" << intSize->intHeight
        << ", floatSize=" << floatSize->floatWidth << "x" << floatSize->floatHeight
        << ")" << std::endl;
}
