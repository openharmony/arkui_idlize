/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package handwritten

import koalaui.arkoala.AnimateParam
import koalaui.arkoala.CommonMethod
import koalaui.interop.KPointer

interface PageTransitionExitInterface {}
interface CommonTransition {}
interface NavigationAttribute {}
interface SubscribaleAbstract {}
interface ISinglePropertyChangeSubscriber {}
interface IPropertySubscriber {}
interface AbstractProperty {}
interface BaseCustomComponent {}
interface CustomComponent {}
interface CustomComponentV2 {}
interface AttributeModifier<T> {
    var isUpdater: () -> Boolean
    fun applyNormalAttribute(instance: T): Unit
    fun applyPressedAttribute(instance: T): Unit
    fun applyFocusedAttribute(instance: T): Unit
    fun applyDisabledAttribute(instance: T): Unit
    fun applySelectedAttribute(instance: T): Unit
}
class AttributeUpdater<T>: AttributeModifier<T> {
    override var isUpdater: () -> Boolean = { true }
    override fun applyNormalAttribute(instance: T): Unit {}
    override fun applyPressedAttribute(instance: T): Unit {}
    override fun applyFocusedAttribute(instance: T): Unit {}
    override fun applyDisabledAttribute(instance: T): Unit {}
    override fun applySelectedAttribute(instance: T): Unit {}
    fun initializeModifier(instance: T): Unit {}
    val attribute: T?
        get() = null
    fun onComponentChanged(component: T): Unit {}
}
interface PageTransitionEnterInterface {}
interface SystemBarStyle {}
interface UICommonBase {}

fun _animateTo(param: AnimateParam, event: (() -> Unit)): Unit {}
fun _animationStart(param: AnimateParam, isFirstBuild: Boolean): Unit {}
fun _animationEnd(isFirstBuild: Boolean, update: (() -> Unit)): Unit {}

fun enterForeignContext(context: KPointer) {}
fun leaveForeignContext() {}

fun Routed(
    /** @memo */
    initial: () -> Unit,
    initialUrl: String? = null,
): Unit {}

class ImageData {
    init {
        error("Not implemented")
    }
}

interface UIGestureEvent {}

typealias CustomStyles = (instance: CommonMethod) -> Unit
interface CustomDialogControllerOptions {}
class CustomDialogController(value: CustomDialogControllerOptions) {}

class ModifierState {
    fun addRef(): Unit {}
    fun fireChange(): Unit {}
}

class WrappedBuilder {}
open class ComponentContentBase {}
class ComponentContent<T>: ComponentContentBase() {}

interface TabContentAttribute {}
/** @memo */
fun TabContent(
    /** @memo */
    style: ((attributes: TabContentAttribute) -> Unit)?,
    /** @memo */
    content_: (() -> Unit)? = null,
): Unit {}

class Gesture {}
class GestureGroup {}
class TapGesture {}
class LongPressGesture {}
class PanGesture {}
class PinchGesture {}
class RotationGesture {}
class SwipeGesture {}
class GestureHandler {}
class LongPressGestureHandler {}
class PanGestureHandler {}
class PinchGestureHandler {}
class TapGestureHandler {}
class RotationGestureHandler {}
class SwipeGestureHandler {}
