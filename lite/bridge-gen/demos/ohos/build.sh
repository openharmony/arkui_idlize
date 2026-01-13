mkdir -p build
g++ -I../../../external/interop/src/cpp -I./.connect.cache/generated/node/target src/stub.cpp -fPIC -shared -o build/libohosxml.so
