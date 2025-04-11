@memo
@BuilderLambda("%COMPONENT_NAME%Impl")
export declare function %COMPONENT_NAME%(
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): %COMPONENT_NAME%Attribute

@memo
export declare function %COMPONENT_NAME%Impl(
    style: ((attributes: %COMPONENT_ATTRIBUTE_NAME%) => void) | undefined,
    %FUNCTION_PARAMETERS%
    @memo
    content_?: () => void,
): void