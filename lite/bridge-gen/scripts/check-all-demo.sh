npm run compile
echo "RUNTIME (GENERATE + RUN)"
cd demos/runtime/native && node ../../.. && LD_LIBRARY_PATH='./bin' node test/main.cjs && cd ../../..
echo "SIMPLE (GENERATE)"
cd demos/simple && node ../.. && cd ../..
echo "RAYLIB (GENERATE)"
cd demos/raylib && node ../.. && cd ../..
echo "EVENT (GENERATE)"
cd demos/event && node ../.. && cd ../..
