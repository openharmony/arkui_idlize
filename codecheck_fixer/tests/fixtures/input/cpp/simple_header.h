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
