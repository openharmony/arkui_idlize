@memo
static _instantiateImpl<T extends %INTERFACE_NAME%>(
    @memo @memo_skip
    styles: (instance: T) => void,
    factory: () => T,
    @memo @memo_skip
    _content: CustomBuilder): void
{
    const instanceExtendable = remember(factory);
    @memo @memo_skip
    const cb = (instance: %COMPONENT_ATTRIBUTE_NAME%): void => {
        styles(instanceExtendable);
        let commonStyles = instanceExtendable.__get__commonStyles__Internal()
        if (commonStyles) {
            commonStyles.forEach((func) => {
                func(instance);
            })
        }
        instanceExtendable.__set__commonStyles__Internal(new Array<(instance: %BASE_COMPONENT_NAME%) => void>);
    }
    %COMPONENT_NAME%Impl(
        cb,
        _content
    );
}
