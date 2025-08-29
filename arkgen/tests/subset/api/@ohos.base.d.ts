export declare interface Callback<T> {}
export declare type ErrorCallback = () => void
export declare class Want {
    stub(): void
}
export declare interface BusinessError<T = void> {
    name: string;
    message: string;
    stack?: string;
    code: number;
    data: T;
}