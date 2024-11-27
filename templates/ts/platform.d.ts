
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

