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

 /  / File with various comment styles and documentation to verify comment formatting preservation
#include < iostream > #include < string > / *  *  * @brief Class demonstrating different comment styles and documentation formats *  * This class contains methods with various types of comments and documentation that can be very long and should be properly formatted by the formatter * / class DocumentedClass {
public: /  /  / Default constructor with triple - slash Doxygen style comment
    DocumentedClass() = default; / *  *  * @brief Method for data processing with detailed documentation and parameter descriptions * @param input Input data for processing represented as a string that can be very long and contain lots of information * @param output Output data after processing also represented as a string with results * @return true if processing was successful, false otherwise indicating an error condition * / bool ProcessData(const std::string& input, std::string& output); /  / Regular single - line comment that can be very long and exceed the maximum line length limit configured in the formatter settings
    void SimpleMethod() { / * Multi - line comment
          that spans several lines
          and can contain various information about the implementation * / int x = 42; /  / Inline comment demonstrating end - of - line documentation
    } / * ! * \brief Doxygen - style comment using exclamation mark prefix * \details Detailed method description that can be very long and contain lots of information about how the method works and what it does * \param[in] value Input value that will be processed by the method * \return Processing result after applying transformation to input * / int DoxygenMethod(int value) {
        return value * 2; }

private:
    int value_; /  /  / < Private field with inline documentation using triple - slash comment style
    std::string name_; /  / ! < Object name using inline Doxygen comment with exclamation mark
}; 