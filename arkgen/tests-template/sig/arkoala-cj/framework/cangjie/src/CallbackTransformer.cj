package idlize

public class CallbackTransformer {
    static func transformFromCustomBuilder(value: CustomBuilder): CustomNodeBuilder {
        throw Exception("Not implemented")
    }
    static func transformToCustomBuilder(value: CustomNodeBuilder): CustomBuilder {
        throw Exception("Not implemented")
    }
}