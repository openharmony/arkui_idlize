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
    @memo
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): void {
    const receiver = remember<%COMPONENT_CLASS_NAME%>((): %COMPONENT_CLASS_NAME% => {
        return new %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>((): %PEER_CLASS_NAME% => %PEER_CLASS_NAME%.create(receiver), (_: %PEER_CLASS_NAME%): void => {
        %PEER_CALLABLE_INVOKE%
        style?.(receiver)
        with%COMPONENT_NAME%Style(receiver, receiver._modifier)
        content_?.()
        receiver.applyAttributesFinish()
    })
}
