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

import java.util.function.Consumer;

public class Application {
    UserView view;
    Consumer<PeerNode> builderFunction;
    PeerNode rootNode;

    Application(UserView view) {
        this.view = view;
        builderFunction = view.getBuilder();
        rootNode = ArkColumnPeer.create(ArkUINodeType.Column, null, 0);
    }

    public static void main(String[] args) {
        var app = Application.createApplication("init", "");
        var root = app.start();
        try {
            for (int i = 0; i < 10; i++) {
                app.loopIteration(i, 0);
                Thread.sleep(100);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static Application createApplication(String app, String params) {
        NativeModule._NativeLog("NativeModule.createApplication " +  app + " , params=" + params);
        UserView view = (UserView)NativeModule._LoadUserView("org.koalaui.arkoala.View" + app, params);
        if (view == null) throw new Error("Cannot load user view");
        return new Application(view);
    }

    public boolean enter(int arg0, int arg1) {
        return loopIteration(arg0, arg1);
    }

    public boolean loopIteration(int arg0, int arg1) {
        checkEvents(arg0);
        updateState();
        render();
        return false;
    }

    byte[] eventBuffer = new byte[4 * 60];

    void checkEvents(int what) {
        System.out.println("JAVA: checkEvents " + what);
        while (NativeModule._CheckArkoalaGeneratedEvents(eventBuffer, eventBuffer.length) != 0) {
            System.out.println("JAVA: checkEvents: got an event: " + (int)eventBuffer[0]);
        }
    }

    void updateState() {
        System.out.println("JAVA: updateState");
    }

    void render() {
        System.out.println("JAVA: render");
        builderFunction.accept(rootNode);
    }

    public long start() {
        System.out.println("JAVA: start");
        return 42;
    }
}
