export interface ArgType {
    field: number
}

export namespace hilog {

    export function debug(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    export function info(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    export function warn(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    export function error(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    export function fatal(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    export function isLoggable(domain: number, tag: string, level: LogLevel): boolean;
    export function setMinLogLevel(level: LogLevel): void;

    // namespace inner {
    //     function f(): void
    //     function g(): number
    //     function g(x:number): number
    //     function g(x:string, y:number): number
    //
    //     function f1(x:number): void
    //     function f2(x?:number): void
    //     function f3(x?:number[]): void
    // }

    export enum LogLevel {
        DEBUG = 3,
        INFO = 4,
        WARN = 5,
        ERROR = 6,
        FATAL = 7
    }
}
