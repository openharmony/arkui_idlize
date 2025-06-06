export interface Callback<T> {
    onSuccess(result: T): void;
    onFailure(errorCode: number): void;
}
