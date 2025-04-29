/** @memo */
public func Ark%COMPONENT_NAME%(
    /** @memo */
    style: ?((attributes: %COMPONENT_ATTRIBUTE_NAME%) -> Unit),
    /** @memo */
    content_: ?(() -> Unit)%FUNCTION_PARAMETERS%
) {
    let receiver = remember({ => 
        return %COMPONENT_CLASS_NAME%()
    })
    NodeAttach<%PEER_CLASS_NAME%>({ => %PEER_CLASS_NAME%.create(receiver, 0)}, { =>
        %PEER_CALLABLE_INVOKE%
        let newStyle = style
        if (let Some(style) <- newStyle) {
            // style(receiver)
        }
        let newContent = content_
        if (let Some(content_) <- newContent) {
            content_()
        }
        receiver.applyAttributesFinish()
    })
}