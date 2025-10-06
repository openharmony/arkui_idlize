package xmldemo

import ohos.xml.xml_EventType
import ohos.xml.xml_MapTest
import ohos.xml.xml_ParseInfo
import ohos.xml.xml_ParseOptions
import ohos.xml.xml_XmlPullParser
import synthetic_types.Union_Buffer_DataView

public fun run() {
    val sampleXml = "<foo valOfFoo=\"xx\">Hello<bar>124</bar>World</foo>"
    println("PARSING ${sampleXml}")
    val buffer = encodeText(sampleXml)
    val parser = xml_XmlPullParser(Union_Buffer_DataView(buffer), "utf8")
    parser.parseXml(
        object: xml_ParseOptions {
            override var supportDoctype: Boolean? = true;
            override var ignoreNameSpace: Boolean? = false;
            override var tagValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name, value ->
                println("TAG ${name} VALUE ${value}")
                true
            };
            override var attributeValueCallbackFunction: ((name: String, value: String) -> Boolean)? = { name, value ->
                println("ATTR ${name} VALUE ${value}")
                true
            };
            override var tokenValueCallbackFunction: ((eventType: xml_EventType, value: xml_ParseInfo) -> Boolean)? = { eventType, value ->
                println("TOKEN ${eventType} VALUE ${value}")
                true
            }
        }
    )

    val mt = xml_MapTest()
    val m = mutableMapOf<String, Double>("a" to 1.0, "b" to 2.0)
    val res = mt.testSerialize(m)
    println("result: $res")
}
