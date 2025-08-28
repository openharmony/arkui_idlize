
@memo
export function %COMPONENT_NAME%Impl(
    @memo
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,
    @memo
    content_?: () => void,
): void {
    const receiver = remember<%COMPONENT_CLASS_NAME%>((): %COMPONENT_CLASS_NAME% => {
        return new %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>((): %PEER_CLASS_NAME% => %PEER_CLASS_NAME%.create(receiver), (_: %PEER_CLASS_NAME%): void => {
        style?.(receiver)
        content_?.()
    })
}
