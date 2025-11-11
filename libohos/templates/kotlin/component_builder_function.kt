public fun %COMPONENT_NAME%(style: %COMPONENT_INTERFACE%.() -> Unit, content: ArkUIBuilderNode.() -> Unit = {}): ComponentBase {
    val instance = Ark%COMPONENT_NAME%Component()
    instance.apply(style)
    ArkUIBuilderNode(instance).apply(content)
    return instance
}
