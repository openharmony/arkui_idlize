mkdir -p bin
g++ src/library.cc -I../../../essentials -I./include -fPIC -shared -o bin/libruntime.so
