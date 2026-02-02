package xmldemo

import ohos.xml.xml
import synthetic_types.Union_Buffer_Langlib_DataView_

public fun run() {
    val sampleXml = "<foo valOfFoo=\"xx\">Hello<bar>124</bar>World</foo>"
    println("PARSING ${sampleXml}")
    val buffer = encodeText(sampleXml)
    val parser = xml.XmlPullParser(Union_Buffer_Langlib_DataView_(buffer), "utf8")
    parser.parseXml(
        object: xml.ParseOptions {
            override var supportDoctype: Boolean? = true
            override var ignoreNameSpace: Boolean? = false
            override var tagValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name, value ->
                println("TAG ${name} VALUE ${value}")
                true
            }
            override var attributeValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name, value ->
                println("ATTR ${name} VALUE ${value}")
                true
            }
            override var tokenValueCallbackFunction: ((eventType: xml.EventType, value: xml.ParseInfo) -> Boolean)? = { eventType, value ->
                println("TOKEN ${eventType} VALUE ${value}")
                true
            }
        }
    )

    val mt = xml.MapTest()
    val m = mutableMapOf<String, Double>("a" to 1.0, "b" to 2.0)
    val res = mt.testSerialize(m)
    println("result: $res")
}
