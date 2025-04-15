declare function $$<T>(value: T): T

declare const Component: ClassDecorator & ((options: ComponentOptions) => ClassDecorator);

declare const ComponentV2: ClassDecorator & ((options: ComponentOptions) => ClassDecorator);

declare type LocalStorageReference = string

declare interface EntryOptions {
    routeName? : string,
    storage? : LocalStorageReference,
    useSharedStorage? : boolean,
}

declare const Entry: ClassDecorator & ((options?: LocalStorageReference | EntryOptions) => ClassDecorator);

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

declare interface IDataSource<T> {
    totalCount(): number;

    getData(index: number): T;

    registerDataChangeListener(listener: DataChangeListener): void;

    unregisterDataChangeListener(listener: DataChangeListener): void;
}

declare class LazyForEachAttribute extends DynamicNode<LazyForEachAttribute> {}
interface LazyForEachInterface<T> {
    (
        dataSource: IDataSource<T>,
        itemGenerator: (item: T, index: number) => void,
        keyGenerator?: (item: T, index: number) => string
    ): LazyForEachAttribute;
}

declare function ForEach<T> (
    arr: Array<T>,
    itemGenerator: (item: T, index: number) => void,
    keyGenerator?: (item: T, index: number) => string,
): ForEachAttribute<T>;

declare class ForEachAttribute<T> extends DynamicNode<ForEachAttribute<T>> {
}

interface ForEachInterface<T> {
    (
        arr: Array<T>,
        itemGenerator: (item: T, index: number) => void,
        keyGenerator?: (item: T, index: number) => string,
    ): ForEachAttribute<T>
// TODO: have overloads for [] and Array
    /*
      (
        arr: T[],
        itemGenerator: (item: T, index: number) => void,
        keyGenerator?: (item: T, index: number) => string,
      ): ForEachAttribute<T>;
    */
}

declare function LazyForEach<T>(
    dataSource: IDataSource<T>,
    itemGenerator: (item: T, index: number) => void,
    keyGenerator?: (item: T, index: number) => string,
): LazyForEachAttribute // extends LazyForEachInterface<T> {}

// Until we have full sdk
declare interface LayoutChild {}

// Handwritten

declare const PageTransitionEnter: PageTransitionEnterInterface
declare const PageTransitionExit: PageTransitionExitInterface
