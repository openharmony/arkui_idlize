declare const Component: ClassDecorator & ((options: ComponentOptions) => ClassDecorator);

declare const ComponentV2: ClassDecorator & ((options: ComponentOptions) => ClassDecorator);

declare interface EntryOptions {
  routeName? : string,
  storage? : LocalStorage,
  useSharedStorage? : boolean,
}

declare const Entry: ClassDecorator & ((options?: LocalStorage | EntryOptions) => ClassDecorator);

declare const Observed: ClassDecorator;

declare const ObservedV2: ClassDecorator;

declare const Preview: ClassDecorator & ((value: PreviewParams) => ClassDecorator);

declare const Require: PropertyDecorator;

declare const BuilderParam: PropertyDecorator;

declare const Local: PropertyDecorator;

declare const Param: PropertyDecorator;

declare const Once: PropertyDecorator;

declare const Event: PropertyDecorator;

declare const State: PropertyDecorator;

declare const Track: PropertyDecorator;

declare const Trace: PropertyDecorator;

declare const Prop: PropertyDecorator;

declare const Link: PropertyDecorator;

declare const ObjectLink: PropertyDecorator;

declare interface ProvideOptions {
  allowOverride?: string,
}

declare const Provide: PropertyDecorator & ((value: string | ProvideOptions) => PropertyDecorator);

declare const Provider: (aliasName?: string) => PropertyDecorator;

declare const Consume: PropertyDecorator & ((value: string) => PropertyDecorator);

declare const Consumer: (aliasName?: string) => PropertyDecorator;

declare const Computed: MethodDecorator;

declare const StorageProp: (value: string) => PropertyDecorator;

declare const StorageLink: (value: string) => PropertyDecorator;

declare const Watch: (value: string) => PropertyDecorator;

declare const Builder: MethodDecorator;

declare const LocalBuilder: MethodDecorator;

declare const Styles: MethodDecorator;

declare const Extend: MethodDecorator & ((value: any) => MethodDecorator);

declare const AnimatableExtend: MethodDecorator & ((value: Object) => MethodDecorator);

declare const Monitor: MonitorDecorator;

declare type MonitorDecorator = (value: string, ...args: string[]) => MethodDecorator;

declare const Concurrent: MethodDecorator;

declare const Sendable: ClassDecorator;

declare const CustomDialog: ClassDecorator;

declare const LocalStorageLink: (value: string) => PropertyDecorator;

declare const LocalStorageProp: (value: string) => PropertyDecorator;

declare const Reusable: ClassDecorator;

declare class ForEachAttribute extends DynamicNode<ForEachAttribute> {
}

interface ForEachInterface {
  (
    arr: Array<any>,
    itemGenerator: (item: any, index: number) => void,
    keyGenerator?: (item: any, index: number) => string,
  ): ForEachAttribute;
}

declare const ForEach: ForEachInterface;

declare interface DataChangeListener {
    onDataReloaded(): void;

    onDataAdded(index: number): void;

    onDataAdd(index: number): void;

    onDataMoved(from: number, to: number): void;

    onDataMove(from: number, to: number): void;

    onDataDeleted(index: number): void;

    onDataDelete(index: number): void;

    onDataChanged(index: number): void;

    onDataChange(index: number): void;
/*
    // Uncomment for full sdk
    onDatasetChange(dataOperations: DataOperation[]): void;
*/
}

declare interface IDataSource {
    totalCount(): number;

    getData(index: number): any;

    registerDataChangeListener(listener: DataChangeListener): void;

    unregisterDataChangeListener(listener: DataChangeListener): void;
}

declare class LazyForEachAttribute extends DynamicNode<LazyForEachAttribute> {
}

interface LazyForEachInterface {
    (
     dataSource: IDataSource,
     itemGenerator: (item: any, index: number) => void,
     keyGenerator?: (item: any, index: number) => string,
    ): LazyForEachAttribute;
}

declare const LazyForEach: LazyForEachInterface;

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

// Until we have full sdk
type LinearGradient = any
declare interface LayoutChild {}
declare interface ContentModifier<T>{}

