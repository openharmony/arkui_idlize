declare namespace hilog {
    type ArgType = number | string | bigint;
    function debug(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function info(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function warn(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function error(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function fatal(domain: number, tag: string, format: string, ...args: ArgType[]): void;
    function isLoggable(domain: number, tag: string, level: LogLevel): boolean;
    function setMinLogLevel(level: LogLevel): void;

    enum LogLevel {
        DEBUG = 3,
        INFO = 4,
        WARN = 5,
        ERROR = 6,
        FATAL = 7
    }
}

export default hilog;
