import { checkArkoalaCallbacks } from "./CallbacksChecker";
import { ParseInfo, XmlPullParser, xml } from "./xml"

(() => {
    let finished = false
    let pull = () => {
        //
        checkArkoalaCallbacks()
        if (!finished)
            setTimeout(pull, 0)
    };
    setTimeout(pull, 0);
    setTimeout(() => {
        finished = true
    }, 2000);
})();

const sampleXml = String.raw`<foo valOfFoo="xx">Hello<bar>124</bar>World</foo>`
console.log(`PARSING ${sampleXml}`)
const parser = new XmlPullParser(sampleXml)
parser.parse({
    ignoreNameSpace: true,
    supportDoctype: false,
    tagValueCallbackFunction(name: string, value: string) {
        console.log(`TAG ${name} VALUE ${value}`);
        return true
    },
    attributeValueCallbackFunction(name: string, value: string) {
        console.log(`ATTR ${name} VALUE ${value}`);
        return true
    },
    tokenValueCallbackFunction(eventType: xml.EventType, value: ParseInfo) {
        const name = xml.EventType[eventType] ?? `UNKNOWN(${eventType})`
        console.log(`TOKEN ${name} VALUE ${value}`);
        return true
    }
})