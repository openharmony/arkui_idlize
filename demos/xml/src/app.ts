import { EventType, eventTypeStr, ParseInfo, XmlPullParser } from "#compat"

export function run() {
    const sampleXml = `<foo valOfFoo="xx">Hello<bar>124</bar>World</foo>`
    console.log(`PARSING ${sampleXml}`)
    const parser = new XmlPullParser(sampleXml)
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
        tokenValueCallbackFunction: (eventType: EventType, value: ParseInfo) => {
            const name = eventTypeStr(eventType)
            console.log(`TOKEN ${name} VALUE ${value}`);
            return true
        }
    })
}