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

 /  / Test file with complex templates and nested type structures to verify template formatting
#include < type_traits > #include < tuple > #include < functional > namespace advanced { /  / Template with long parameters and enable_if constraints that test formatter's ability to handle complex types
template < typename T, typename U, typename V, typename W, typename = std::enable_if_t < std::is_arithmetic_v < T >  >  > class ComplexTemplate {
public:
    using result_type = std::tuple < T, U, V, W > ; /  / Constructor with perfect forwarding that demonstrates modern C +  + template metaprogramming
    template < typename... Args > explicit ComplexTemplate(Args && ... args) : data_(std::forward < Args > (args)...) {} /  / Method with a long return type that includes SFINAE and tuple construction
    std::enable_if_t < std::is_same_v < T, int > , std::tuple < T, U, V, W >  > Process() const {
        return std::make_tuple(T{}, U{}, V{}, W{}); } /  / Lambda with long capture list and trailing return type that tests lambda formatting
    auto CreateLambda() {
        return [this, capture1 = data_, capture2 = std::string("test"), capture3 = 42](int x, int y, int z) - > decltype(auto) {
            return capture1 + capture2.length() + capture3 + x + y + z; }; }

private:
    result_type data_; }; /  / Variadic template function that demonstrates parameter pack expansion and perfect forwarding
template < typename... Args > auto MakeComplexTuple(Args && ... args) - > std::tuple < std::decay_t < Args > ... > {
    return std::make_tuple(std::forward < Args > (args)...); } /  / SFINAE with long condition combining multiple type traits to test complex template constraints
template < typename T, typename = std::enable_if_t < std::is_integral_v < T > && std::is_signed_v < T > && sizeof(T) > = 4 >  > T ComputeValue(T input) {
    return input * 2 + 1; }

} /  / namespace advanced
