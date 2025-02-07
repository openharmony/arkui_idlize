package idlize

import Interop.*

import std.collection.*

public open class ParseOptions {
    private var supportDoctype_container: Option<Bool>
    mut prop supportDoctype: Option<Bool> {
        get() {
            return supportDoctype_container
        }
        set(x) { supportDoctype_container = x }
    }
    private var ignoreNameSpace_container: Option<Bool>
    mut prop ignoreNameSpace: Option<Bool> {
        get() {
            return ignoreNameSpace_container
        }
        set(x) { ignoreNameSpace_container = x }
    }
    private var tagValueCallbackFunction_container: Option<((name: String, value: String) -> Bool)>
    mut prop tagValueCallbackFunction: Option<((name: String, value: String) -> Bool)> {
        get() {
            return tagValueCallbackFunction_container
        }
        set(x) { tagValueCallbackFunction_container = x }
    }
    private var attributeValueCallbackFunction_container: Option<((name: String, value: String) -> Bool)>
    mut prop attributeValueCallbackFunction: Option<((name: String, value: String) -> Bool)> {
        get() {
            return attributeValueCallbackFunction_container
        }
        set(x) { attributeValueCallbackFunction_container = x }
    }
    private var tokenValueCallbackFunction_container: Option<((eventType: EventType, value: ParseInfo) -> Bool)>
    mut prop tokenValueCallbackFunction: Option<((eventType: EventType, value: ParseInfo) -> Bool)> {
        get() {
            return tokenValueCallbackFunction_container
        }
        set(x) { tokenValueCallbackFunction_container = x }
    }
    ParseOptions(supportDoctype: Option<Bool>, ignoreNameSpace: Option<Bool>, tagValueCallbackFunction: Option<((name: String, value: String) -> Bool)>, attributeValueCallbackFunction: Option<((name: String, value: String) -> Bool)>, tokenValueCallbackFunction: Option<((eventType: EventType, value: ParseInfo) -> Bool)>) {
        super()
        this.supportDoctype_container = supportDoctype
        this.ignoreNameSpace_container = ignoreNameSpace
        this.tagValueCallbackFunction_container = tagValueCallbackFunction
        this.attributeValueCallbackFunction_container = attributeValueCallbackFunction
        this.tokenValueCallbackFunction_container = tokenValueCallbackFunction
    }
}