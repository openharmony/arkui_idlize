
declare interface GenericInterface<T> {
    setData(data: T)
    callHandler()
}

declare interface GenericInterfaceDataHandler<T> {
    onData(data: T): void;
}

