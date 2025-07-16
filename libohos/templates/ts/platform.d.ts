
type buffer = ArrayBuffer;

declare const console: {
    assert(value: any, message?: string, ...optionalParams: any[]): void;

    clear(): void;

    count(label?: string): void;

    countReset(label?: string): void;

    debug(message?: any, ...optionalParams: any[]): void;

    // dir(obj: any, options?: InspectOptions): void;

    dirxml(...data: any[]): void;

    error(message?: any, ...optionalParams: any[]): void;

    group(...label: any[]): void;

    groupCollapsed(...label: any[]): void;

    groupEnd(): void;

    info(message?: any, ...optionalParams: any[]): void;

    log(message?: any, ...optionalParams: any[]): void;

    table(tabularData: any, properties?: ReadonlyArray<string>): void;

    time(label?: string): void;

    timeEnd(label?: string): void;

    timeLog(label?: string, ...data: any[]): void;

    trace(message?: any, ...optionalParams: any[]): void;

    warn(message?: any, ...optionalParams: any[]): void;

    profile(label?: string): void;

    profileEnd(label?: string): void;

    timeStamp(label?: string): void;

}

// Improve: these are symbols to help ohos-typescript frontend (aka ets-tsc)
// perform @Styles no-receiver recovery 
// and imitate this.$name struct members

declare interface CommonMethod {
    /**
     * Koala extension
     */
    __applyStyle(style: (instance: CommonMethod, ...args: any) => this, ...args: any): CommonMethod

    /**
     * Improve: adding .$fields should be done before the type checker.
     * we workaround that by allowing any fields on structs.
     */
    [key: string]: any;
}


