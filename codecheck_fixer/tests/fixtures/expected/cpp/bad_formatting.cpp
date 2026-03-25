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

 /  / Test file with poor formatting to verify clang - format can fix inconsistent code style
#include < string > #include < vector > #include < memory > namespace test{
class BadlyFormattedClass{
public:
BadlyFormattedClass(){}
~BadlyFormattedClass( ){}

void MethodWithBadSpacing(int x, int y, int z){
int result = x + y + z; if(result > 0){
std::cout <  < "Result is positive" <  < std::endl; }
else if(result < 0){
std::cout <  < "Result is negative" <  < std::endl; }else{
std::cout <  < "Result is zero" <  < std::endl; }
} /  / Mixed indentation with tabs and spaces that should be normalized
  void MixedIndentation() {
      if (true) {
    std::cout <  < "Tab indented" <  < std::endl; }
  }

private:
int    x_; double y_   ; std::string   z_; }; /  / Function with poor spacing around template parameters and operators
template < typename T > T Max(T a, T b){
return (a > b)?a:b; } /  / Long line without proper breaks that exceeds the maximum line length limit
void ProcessLongParameterList(int param1, int param2, int param3, int param4, int param5, int param6, int param7, int param8, int param9, int param10) { /  / Implementation goes here with proper formatting
}

} /  / namespace test
