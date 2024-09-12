/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.koalaui.arkoala;

public class Application {
    Application() {}

    public static void main(String[] args) {
        var app = Application.startApplication();
        try {
            for (int i = 0; i < 10; i++) {
                app.loopIteration(i, 0);
                Thread.sleep(100);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static Application startApplication() {
        return new Application().start();
    }

    public void enter(int arg0, int arg1) {
        loopIteration(arg0, arg1);
    }

    public void loopIteration(int arg0, int arg1) {
        checkEvents(arg0);
        updateState();
        render();
    }

    void checkEvents(int what) {
        System.out.println("JAVA: checkEvents " + what);
    }

    void updateState() {
        System.out.println("JAVA: updateState");
    }

    void render() {
        System.out.println("JAVA: render");
    }

    public Application start() {
        return this;
    }
}
