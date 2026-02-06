mkdir -p build
g++ -I../../../node_modules/@koalaui/interop/src/cpp -I./.connect.cache/generated/node/target src/stub.cpp -fPIC -shared -o build/libohosxml.so
