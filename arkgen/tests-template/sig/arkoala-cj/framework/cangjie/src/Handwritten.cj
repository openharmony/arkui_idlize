package idlize

import Interop.*

public type CustomNodeBuilder = (parentNode: Int64) -> Int64


public interface AttributeModifier<T> {}
public interface GestureModifier {}
public interface ContentModifier<T> {}

public func hookButtonContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookCheckBoxContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookDataPanelContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookGaugeContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookLoadingProgressContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookProgressContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookRadioContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookRatingContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookSelectContentModifier(
    receiver: Object, value: ContentModifier<MenuItemConfiguration>) {}
public func hookSliderContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookTextClockContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookTextTimerContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookToggleContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookGestureModifier(receiver: Object, value: Option<GestureModifier>) {}
public func hookStateStyleImpl(receiver: Any, value: Any) {}
public func hookId(component: Object, value: Option<String>) {}

