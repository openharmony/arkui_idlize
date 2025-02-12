package idlize

import std.collection.*
import Interop.*

public open class Serializer <: SerializerBase {
    static private var nullptr: UInt64 = 0
    private static var pool: Option<ArrayList<Serializer>> = Option.None
    private static var poolTop: Int32 = -1
    static func hold(): Serializer {
        if (!(Serializer.pool.isSome()))
        {
            Serializer.pool = ArrayList<Serializer>(8, {idx => Serializer()});
        }
        let pool: ArrayList<Serializer> = match (Serializer.pool) {
            case Some(serializer) => serializer
            case _ => throw Exception("Unmatched pattern Serializer.pool")
        }
        if (Serializer.poolTop >= Int32(pool.size) - 1)
        {
            throw Exception("Serializer pool is full. Check if you had released serializers before")
        }
        Serializer.poolTop = Serializer.poolTop + 1
        var serializer = pool[Int64(Serializer.poolTop)]
        return serializer
    }
    public func release(): Unit {
        if (Serializer.poolTop == -1)
        {
            throw Exception("Serializer pool is empty. Check if you had hold serializers before")
        }
        let pool: ArrayList<Serializer> = match (Serializer.pool) {
            case Some(serializer) => serializer
            case _ => throw Exception("Unmatched pattern Serializer.pool")
        }
        if (refEq(this, pool[Int64(Serializer.poolTop)]))
        {
            Serializer.poolTop = Serializer.poolTop - 1
            super.release();
            return
        }
        throw Exception("Only last serializer should be released")
    }
    func writeParseOptions(value: ParseOptions): Unit {
        var valueSerializer: Serializer = this
        let value_supportDoctype = value.supportDoctype
        var value_supportDoctype_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_supportDoctype) <- value_supportDoctype) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_supportDoctype_value = value_supportDoctype
            valueSerializer.writeBoolean(value_supportDoctype_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_ignoreNameSpace = value.ignoreNameSpace
        var value_ignoreNameSpace_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_ignoreNameSpace) <- value_ignoreNameSpace) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_ignoreNameSpace_value = value_ignoreNameSpace
            valueSerializer.writeBoolean(value_ignoreNameSpace_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_tagValueCallbackFunction = value.tagValueCallbackFunction
        var value_tagValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_tagValueCallbackFunction) <- value_tagValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_tagValueCallbackFunction_value = value_tagValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_tagValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_attributeValueCallbackFunction = value.attributeValueCallbackFunction
        var value_attributeValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_attributeValueCallbackFunction) <- value_attributeValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_attributeValueCallbackFunction_value = value_attributeValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_attributeValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_tokenValueCallbackFunction = value.tokenValueCallbackFunction
        var value_tokenValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_tokenValueCallbackFunction) <- value_tokenValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_tokenValueCallbackFunction_value = value_tokenValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_tokenValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
    }
    func writeXmlPullParser(value: XmlPullParser): Unit {
        var valueSerializer: Serializer = this
        if (value is MaterializedBase)
        {
            let base: MaterializedBase = match (value as MaterializedBase) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
            let peer = base.getPeer()
            var ptr: UInt64 = nullptr
            if (let Some(peer) <- peer) {
                ptr = peer.ptr
            }
            valueSerializer.writePointer(ptr);
            return
        }
        else
        {
            throw Exception("Value is not a MaterializedBase instance!")
        }
    }
    func writeParseInfo(value: ParseInfo): Unit {
        var valueSerializer: Serializer = this
        if (value is MaterializedBase)
        {
            let base: MaterializedBase = match (value as MaterializedBase) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
            let peer = base.getPeer()
            var ptr: UInt64 = nullptr
            if (let Some(peer) <- peer) {
                ptr = peer.ptr
            }
            valueSerializer.writePointer(ptr);
            return
        }
        else
        {
            throw Exception("Value is not a MaterializedBase instance!")
        }
    }
    func writeXmlSerializer(value: XmlSerializer): Unit {
        var valueSerializer: Serializer = this
        if (value is MaterializedBase)
        {
            let base: MaterializedBase = match (value as MaterializedBase) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
            let peer = base.getPeer()
            var ptr: UInt64 = nullptr
            if (let Some(peer) <- peer) {
                ptr = peer.ptr
            }
            valueSerializer.writePointer(ptr);
            return
        }
        else
        {
            throw Exception("Value is not a MaterializedBase instance!")
        }
    }
}