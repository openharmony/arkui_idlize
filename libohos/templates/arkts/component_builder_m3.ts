
@memo
export function %COMPONENT_NAME%Impl(
    @memo @memo_skip
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,%CONTENT_PARAMETER%
): void {
    const receiver = remember<%COMPONENT_CLASS_NAME%>((): %COMPONENT_CLASS_NAME% => {
        return new %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>((): %PEER_CLASS_NAME% => %PEER_CLASS_NAME%.create(receiver), (_: %PEER_CLASS_NAME%): void => {
        style?.(receiver)%CONTENT_PARAMETER_INVOCATION%
    })
}
