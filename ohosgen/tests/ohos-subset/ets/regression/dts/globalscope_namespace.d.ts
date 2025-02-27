declare namespace hilog {

    interface ArgType {
        field: number
    }

    function debug(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function info(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function warn(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function error(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function fatal(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function isLoggable(domain: number, tag: string, level: LogLevel): boolean;
    function setMinLogLevel(level: LogLevel): void;

    namespace inner {
        function f(): void
        function g(): number
        function g(x:number): number
        function g(x:string, y:number): number

        function f1(x:number): void
        function f2(x?:number): void
        function f3(x?:number[]): void
    }

    enum LogLevel {
        DEBUG = 3,
        INFO = 4,
        WARN = 5,
        ERROR = 6,
        FATAL = 7
    }
}

export default hilog;
