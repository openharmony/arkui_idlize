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

    onDatasetChange(dataOperations: DataOperation[]): void;
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

declare function setTimeout(handler: Function | string, delay?: number, ...arguments: any[]): number;

declare function setInterval(handler: Function | string, delay: number, ...arguments: any[]): number;

declare function clearInterval(intervalID?: number): void;

declare class TextEncoder {
    encode(input?: string): Uint8Array;
    encodeInto(input?: string): Uint8Array;
    encodeInto(input: string, dest: Uint8Array): { read: number; written: number };
}

declare class TextDecoder {
    decode(input: Uint8Array, options?: { stream?: false }): string;
}

declare class performance {
    static now(): number;
}

// Handwritten

declare const NavDestination: NavDestinationInterface
declare const NavDestinationInstance: NavDestinationAttribute

