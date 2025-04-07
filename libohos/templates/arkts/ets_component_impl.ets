/** @memo */
export function %COMPONENT_NAME%(
  /** @memo */
  style: ((attributes: %COMPONENT_NAME%Attribute) => void) | undefined,
  %FUNCTION_PARAMETERS%
  /** @memo */
  content_?: () => void,
) {
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