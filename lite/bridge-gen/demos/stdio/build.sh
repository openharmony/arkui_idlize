mkdir -p build
gcc src/io.cpp -I./include -lc -fPIC -shared -o build/libiozhik.so
