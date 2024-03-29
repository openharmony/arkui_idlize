export class PeerGeneratorConfig {
    public static commonMethod = ["CommonMethod"]

    public static ignoreSerialization = ["Array", "Callback", "ErrorCallback", "Length"]

    public static readonly rootComponents = [
        "CommonMethod",
        "SecurityComponentMethod"
    ]

    // Will figure out what to do with those later, currently will extend PeerNode
    public static readonly standaloneComponents = [
        "CalendarAttribute",
        "ContainerSpanAttribute"
    ]

    public static skipPeerGeneration = ["CommonAttribute"]

    static mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    }
}