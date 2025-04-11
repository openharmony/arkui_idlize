@memo
@BuilderLambda("%COMPONENT_NAME%Impl")
export function %COMPONENT_NAME%(
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): %COMPONENT_NAME%Attribute {
    throw new Error("Not implemented")
}

@memo
export function %COMPONENT_NAME%Impl(
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): void {
    const receiver = remember(() => {
        return new %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>((): %PEER_CLASS_NAME% => %PEER_CLASS_NAME%.create(receiver), (_: %PEER_CLASS_NAME%) => {
        %PEER_CALLABLE_INVOKE%
        style?.(receiver)
        content_?.()
        receiver.applyAttributesFinish()
    })
}