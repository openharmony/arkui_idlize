/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file
 * @kit ArkUI
 */

/**
 * Provides an Effect Component, which is invisible, but setting properties on this component defines an effect template
 * that child components can apply by setting useEffect(true).
 *
 * @interface EffectComponentInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
interface EffectComponentInterface {
  /**
   * Return effectComponent.
   *
   * @returns { EffectComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  (): EffectComponentAttribute;
}

/**
 * Defines the Effect Component attribute functions.
 *
 * @extends CommonMethod<EffectComponentAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare class EffectComponentAttribute extends CommonMethod<EffectComponentAttribute> {}

/**
 * Defines Effect Component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const EffectComponent: EffectComponentInterface;

/**
 * Defines Effect Component instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const EffectComponentInstance: EffectComponentAttribute;
