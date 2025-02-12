package idlize

import std.collection.*

public func eventTypeStr(eventType: EventType): String {
    return "UNKNOWN"
}

public func pullEvents() {
    checkArkoalaCallbacks()
}

public func run() {
    let sampleXml = "<foo valOfFoo=\"xx\">Hello<bar>124</bar>World</foo>"
    println("PARSING ${sampleXml}")
    let parser = XmlPullParser(ArrayList(sampleXml).toArray(), Option.None)
    parser.parse(ParseOptions(true, false,
        { name: String, value: String =>
            println("TAG ${name} VALUE ${value}");
            return true
        },
        { name: String, value: String =>
            println("ATTR ${name} VALUE ${value}");
            return true
        },
        { eventType: EventType, value: ParseInfo =>
            let name = eventTypeStr(eventType)
            println("TOKEN ${name} VALUE ");
            return true
        }
    ))
}

main() {
    run()
    pullEvents()
}