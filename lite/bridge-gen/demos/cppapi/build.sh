mkdir -p build
g++ src/cxxtest.cc -I./include -fPIC -o build/cxxtest.o -c
g++ build/cxxtest.o -lc -shared -o build/libcxxtest.so
ar rcs build/libcxxtest.a build/cxxtest.o
