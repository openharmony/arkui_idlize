export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]

    public static readonly rootComponents = [
        "CommonMethod",
        "ScrollableCommonMethod",
        "SecurityComponentMethod",
        "CommonShapeMethod",
        "BaseSpan",
    ]

    // Will figure out what to do with those later, currently will extend PeerNode
    public static readonly standaloneComponents = [
        "CalendarAttribute",
        "ContainerSpanAttribute"
    ]

    public static skipPeerGeneration = ["CommonAttribute"]
}