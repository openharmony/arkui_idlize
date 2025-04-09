
export interface GenericInterface<T> {
    setData(data: T): void
    callHandler(): void
}

export interface GenericInterfaceDataHandler<T> {
    onData(data: T): void;
}

