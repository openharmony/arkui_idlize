package idlize

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
}