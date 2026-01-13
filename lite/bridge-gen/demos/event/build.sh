mkdir -p build
gcc src/event.cc -I../../essentials -fPIC -shared -o build/libevent.so
