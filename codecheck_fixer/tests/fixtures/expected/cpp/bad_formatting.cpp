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
