import { xml, EventType, eventTypeStr, encodeText } from "#compat"

export function run() {
    const sampleXml = `<foo valOfFoo="xx">Hello<bar>124</bar>World</foo>`
    console.log(`PARSING ${sampleXml}`)
    const buffer = encodeText(sampleXml)
    const parser = new xml.XmlPullParser(buffer)
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
}