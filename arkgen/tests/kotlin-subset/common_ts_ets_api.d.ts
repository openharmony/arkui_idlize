/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

declare class LocalStorage {
/*
  // Uncomment for full sdk

  constructor(initializingProperties?: Object);
  static GetShared(): LocalStorage;
  static getShared(): LocalStorage;
  public ref<T>(propName: string): AbstractProperty<T> | undefined;
  public setAndRef<T>(propName: string, defaultValue: T): AbstractProperty<T>;
  has(propName: string): boolean;
  keys(): IterableIterator<string>;
  size(): number;
  get<T>(propName: string): T | undefined;
  set<T>(propName: string, newValue: T): boolean;
  setOrCreate<T>(propName: string, newValue: T): boolean;
  link<T>(propName: string): SubscribedAbstractProperty<T>;
  setAndLink<T>(propName: string, defaultValue: T): SubscribedAbstractProperty<T>;
  prop<S>(propName: string): SubscribedAbstractProperty<S>;
  setAndProp<S>(propName: string, defaultValue: S): SubscribedAbstractProperty<S>;
  delete(propName: string): boolean;
  clear(): boolean;
*/
}

/*
interface IPropertySubscriber {

  id(): number;
  aboutToBeDeleted(owningView?: IPropertySubscriber): void;
}

interface ISinglePropertyChangeSubscriber<T> extends IPropertySubscriber {
  hasChanged(newValue: T): void;
}

declare class SyncedPropertyOneWay<T>
  extends SubscribedAbstractProperty<T>
  implements ISinglePropertyChangeSubscriber<T>
{
  private wrappedValue_;
  private source_;
  constructor(source: SubscribedAbstractProperty<T>, subscribeMe?: IPropertySubscriber, info?: string);
  aboutToBeDeleted(unsubscribeMe?: IPropertySubscriber): void;
  hasChanged(newValue: T): void;
  get(): T;
  set(newValue: T): void;
}

declare class SyncedPropertyTwoWay<T>
  extends SubscribedAbstractProperty<T>
  implements ISinglePropertyChangeSubscriber<T>
{

  private source_;
  constructor(source: SubscribedAbstractProperty<T>, subscribeMe?: IPropertySubscriber, info?: string);

  aboutToBeDeleted(unsubscribeMe?: IPropertySubscriber): void;
  hasChanged(newValue: T): void;
  get(): T;
  set(newValue: T): void;
}

declare abstract class SubscribedAbstractProperty<T> {

  protected subscribers_: Set<number>;
  private id_;
  private info_?;

  constructor(
    subscribeMe?: IPropertySubscriber,
    info?: string,
  );

    id(): number;

    info(): string;
    abstract get(): T;
    abstract set(newValue: T): void;
    createTwoWaySync(subscribeMe?: IPropertySubscriber, info?: string): SyncedPropertyTwoWay<T>;
    createOneWaySync(subscribeMe?: IPropertySubscriber, info?: string): SyncedPropertyOneWay<T>;
    unlinkSuscriber(subscriberId: number): void;
    protected notifyHasChanged(newValue: T): void;
    protected notifyPropertyRead(): void;
    numberOfSubscrbers(): number;
    abstract aboutToBeDeleted(): void;
}
*/