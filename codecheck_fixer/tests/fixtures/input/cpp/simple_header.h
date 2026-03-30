/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Header file with include guard protection to verify proper header formatting
#ifndef TEST_SIMPLE_HEADER_H
#define TEST_SIMPLE_HEADER_H

#include <string>
#include <vector>

namespace test {

// Simple class for testing basic formatting rules and method declarations
class SimpleClass {
public:
    SimpleClass();
    ~SimpleClass();
    
    // Methods with different formatting styles that should be normalized
    void SetValue(int value);
    int GetValue() const;
    
    // Method with long parameter line that should be reformatted for better readability
    void ProcessData(const std::string& input, std::string& output, bool enable_logging, int max_iterations);
    
    // Static method for instance creation demonstrating factory pattern
    static SimpleClass* CreateInstance(const std::string& name);

private:
    int value_;
    std::string name_;
    std::vector<int> data_;
};

// Inline function with poor formatting demonstrating need for space normalization
inline int Add(int a,int b){return a+b;}

// Template function with inconsistent spacing that requires formatting
template<typename T>
inline T Max(const T&a,const T&b){
return (a>b)?a:b;
}

} // namespace test

#endif // TEST_SIMPLE_HEADER_H
