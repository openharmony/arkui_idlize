mkdir -p build
gcc src/io.cc -I./include -lc -fPIC -shared -o build/libiozhik.so
