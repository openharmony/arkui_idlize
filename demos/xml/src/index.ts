import { checkArkoalaCallbacks } from "./CallbacksChecker";
import { ParseInfo, XmlPullParser } from "./xml"
// TODO Actually it is an enum, need to be generated
enum EventType {
    START_DOCUMENT,
    END_DOCUMENT,
    START_TAG,
    END_TAG,
    TEXT,
    CDSECT,
    COMMENT,
    DOCDECL,
    INSTRUCTION,
    ENTITY_REFERENCE,
    WHITESPACE
}

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
    tokenValueCallbackFunction(eventType: EventType, value: ParseInfo) {
        const name = EventType[eventType] ?? `UNKNOWN(${eventType})`
        console.log(`TOKEN ${name} VALUE ${value}`);
        return true
    }
})