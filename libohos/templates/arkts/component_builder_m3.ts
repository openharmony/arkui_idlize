
@memo
export function %COMPONENT_NAME%Impl(
    @memo
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,%CONTENT_PARAMETER%
): void {
    const receiver = remember<%COMPONENT_CLASS_NAME%>((): %COMPONENT_CLASS_NAME% => {
        return new %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>((): %PEER_CLASS_NAME% => %PEER_CLASS_NAME%.create(receiver), (peer: %PEER_CLASS_NAME%): void => {
        receiver.setPeer(peer)
        style?.(receiver)
        receiver.setPeer(undefined)%CONTENT_PARAMETER_INVOCATION%
    })
}
