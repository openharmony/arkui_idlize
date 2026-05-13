/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
package idlize

import koalaui.interop.*

public fun run() {
    val sampleXml = "<foo valOfFoo=\"xx\">Hello<bar>124</bar>World</foo>"
    println("PARSING ${sampleXml}")
    val buffer = encodeText(sampleXml)
    val parser = xml_XmlPullParser(buffer, "utf8")
    parser.parse(
        object: xml_ParseOptions {
            override var supportDoctype: Boolean? = true;
            override var ignoreNameSpace: Boolean? = false;
            override var tagValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name: String, value: String ->
                println("TAG ${name} VALUE ${value}")
                true
            };
            override var attributeValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name: String, value: String ->
                println("ATTR ${name} VALUE ${value}")
                true
            };
            override var tokenValueCallbackFunction: ((eventType: xml_EventType, value: xml_ParseInfo) -> Boolean)? = { eventType: EventType, value: xml_ParseInfo ->
                println("TOKEN eventType VALUE value")
                true
            }
        }
    )

    val mt = xml_MapTest()
    val m = mutableMapOf<String, Double>("a" to 1.0, "b" to 2.0)
    val res = mt.testSerialize(m)
    println("result: $res")
}
