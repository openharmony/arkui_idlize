package idlize

import Interop.*

public interface AttributeModifier<T> {}
public interface ContentModifier<T> {}

public func hookCheckBoxContentModifier(
    receiver: ArkCheckboxComponent, value: ?ContentModifier<CheckBoxConfiguration>) {
    InteropNativeModule._NativeLog("hookCheckBoxContentModifier is not implemented for arkoala")
}
