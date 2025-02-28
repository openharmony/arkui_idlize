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
