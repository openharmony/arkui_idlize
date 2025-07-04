@memo
@BuilderLambda("%COMPONENT_NAME%")
export function %COMPONENT_NAME%(
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): %COMPONENT_NAME%Attribute { throw new Error("")}

@memo
export function %COMPONENT_NAME%(
    @memo
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): void { throw new Error("") }