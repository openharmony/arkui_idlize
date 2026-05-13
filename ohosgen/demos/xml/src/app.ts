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
import { xml, EventType, eventTypeStr, encodeText } from "#compat"

export function run() {
    xml.returnPromise().then((value: number) => console.log('FROM PROMISE: ' + value))
    const point = xml.getPoint()
    console.log(`GOT point (${point.x},${point.y})`)
    const sampleXml = `<foo valOfFoo="xx">Hello<bar>124</bar>World</foo>`
    console.log(`PARSING ${sampleXml}`)
    const buffer = encodeText(sampleXml)
    const parser = new xml.XmlPullParser(buffer, 'utf8')
    parser.parse({
        ignoreNameSpace: true,
        supportDoctype: false,
        tagValueCallbackFunction: (name: string, value: string) => {
            console.log(`TAG ${name} VALUE ${value}`);
            return true
        },
        attributeValueCallbackFunction: (name: string, value: string) => {
            console.log(`ATTR ${name} VALUE ${value}`);
            return true
        },
        tokenValueCallbackFunction: (eventType: EventType, value: xml.ParseInfo) => {
            const name = eventTypeStr(eventType)
            console.log(`TOKEN ${name} VALUE ${value}`);
            return true
        }
    })

    let mt = new xml.MapTest()
    let m = new Map<string, number>()
    m.set("a", 1)
    m.set("b", 2)
    let res: number = mt.testSerialize(m)
    console.log(`result: ${res}`)
}
