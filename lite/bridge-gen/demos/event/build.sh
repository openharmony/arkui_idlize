mkdir -p build
gcc src/event.cpp -I../../essentials -fPIC -shared -o build/libevent.so
