# Copyright (c) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

npm run compile
echo "RUNTIME (GENERATE + RUN)"
cd demos/runtime/native && node ../../.. && LD_LIBRARY_PATH='./bin' node test/main.cjs && cd ../../..
echo "SIMPLE (GENERATE)"
cd demos/simple && node ../.. && cd ../..
echo "RAYLIB (GENERATE)"
cd demos/raylib && node ../.. && cd ../..
echo "EVENT (GENERATE)"
cd demos/event && node ../.. && cd ../..
