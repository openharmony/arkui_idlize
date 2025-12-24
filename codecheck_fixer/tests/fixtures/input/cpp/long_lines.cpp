// Test file with long lines to verify clang-format behavior and proper line wrapping functionality
#include <string>
#include <vector>
#include <memory>

namespace test {

// This is a very long line with a function declaration that should be formatted by clang-format to fit within the line length limit
class VeryLongClassName {
public:
    // Constructor with a very long parameter list that should be wrapped to multiple lines by the formatter
    VeryLongClassName(const std::string& first_parameter, const std::string& second_parameter, int third_parameter, double fourth_parameter, bool fifth_parameter) : first_(first_parameter), second_(second_parameter), third_(third_parameter), fourth_(fourth_parameter), fifth_(fifth_parameter) {}

    // Method with a long initialization line that exceeds the maximum allowed line length
    void ProcessData(const std::vector<std::string>& input_data, std::vector<std::string>& output_data, int max_iterations, bool enable_optimization) {
        // Very long line with a function call and multiple parameters that cannot fit on a single line
        auto result = ProcessComplexOperation(input_data, output_data, max_iterations, enable_optimization, true, false, 42, 3.14);
    }

    // Method returning a smart pointer with a long signature that needs proper formatting
    std::shared_ptr<VeryLongClassName> CreateInstance(const std::string& param1, const std::string& param2, int param3) {
        return std::make_shared<VeryLongClassName>(param1, param2, param3, 0.0, false);
    }

private:
    std::string first_;
    std::string second_;
    int third_;
    double fourth_;
    bool fifth_;

    // Private method with a very long signature containing multiple parameters and complex types
    bool ProcessComplexOperation(const std::vector<std::string>& input, std::vector<std::string>& output, int iterations, bool optimize, bool flag1, bool flag2, int magic_number, double pi_value) {
        // Long line with a complex conditional expression that should be wrapped for better readability
        if (input.size() > 0 && output.size() > 0 && iterations > 0 && optimize && flag1 && !flag2 && magic_number == 42 && pi_value > 3.0) {
            return true;
        }
        return false;
    }
};

} // namespace test
