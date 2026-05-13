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

public func run() {
    let sampleXml = "<foo valOfFoo=\"xx\">Hello<bar>124</bar>World</foo>"
    println("PARSING ${sampleXml}")
    let buffer = encodeText(sampleXml)
    let parser = XmlPullParser(buffer, 'utf8')
    parser.parse(
        ParseOptions(
            true,
            false,
            { name: String, value: String =>
                println("TAG ${name} VALUE ${value}")
                return true
            },
            { name: String, value: String =>
                println("ATTR ${name} VALUE ${value}")
                return true
            },
            { eventType: EventType, value: ParseInfo =>
                println("TOKEN eventType VALUE value")
                return true
            }
        )
    )
}
