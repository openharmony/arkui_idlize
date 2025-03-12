import { performance, toPaddedString } from "#compat"
import { mediaquery as idl } from '#compat'

type BenchmarkFunction = () => void;
class BenchmarkResult {
    mechanism: string;
    scenario: string;
    averageNs: number;

    constructor(
        mechanism: string,
        scenario: string,
        averageNs: number,
    ) {
        this.mechanism = mechanism;
        this.scenario = scenario;
        this.averageNs = averageNs;
    }
};

class BenchmarkBase {
    private mechanisms: Set<string> = new Set<string>();
    private scenarios: Set<string> = new Set<string>();
    private runners: Map<string, BenchmarkFunction> = new Map<string, BenchmarkFunction>();
    private results: Array<BenchmarkResult> = new Array<BenchmarkResult>();
    private targetDurationMs: number = 100; // 100ms for warmup

    // Register a benchmark runner
    registerRunner(mechanism: string, scenario: string, fn: BenchmarkFunction): void {
        this.mechanisms.add(mechanism);
        this.scenarios.add(scenario);
        const key = `${mechanism}:${scenario}`;
        this.runners.set(key, fn);
    }

    // Determine iterations needed for target duration
    private determineIterations(fn: BenchmarkFunction): number {
        let iterations = 1;
        while (true) {
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                fn();
            }
            const duration = performance.now() - start;

            if (duration >= this.targetDurationMs) {
                return Math.max(1, Math.floor((iterations * this.targetDurationMs * 1000000) / duration));
            }
            iterations *= 2;
        }
    }

    // Run a single benchmark
    private runBenchmark(
        mechanism: string,
        scenario: string,
        fn: BenchmarkFunction,
        iterations: number
    ): BenchmarkResult {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            fn();
        }
        const duration = performance.now() - start;

        return new BenchmarkResult(
            mechanism,
            scenario,
            duration / iterations,
        );
    }

    // Run all benchmarks
    runAll(): void {
        for (const mechanism of this.mechanisms) {
            for (const scenario of this.scenarios) {
                const key = `${mechanism}:${scenario}`;
                const runner = this.runners.get(key);

                if (!runner) {
                    console.warn(`No runner found for ${key}`);
                    continue;
                }

                // Warm-up and determine iterations
                console.log(`Warming up ${key}...`);
                const iterations = this.determineIterations(runner);

                // Run actual benchmark
                console.log(`Running ${key} with ${iterations} iterations...`);
                const result = this.runBenchmark(mechanism, scenario, runner, iterations);
                this.results.push(result);
            }
        }
    }

    // Print results
    printResults(): void {
        console.log('\nBenchmark Results:\n');

        // Find maximum lengths for formatting
        const maxMechLen = 10
        const maxScenLen = 10

        // Print header
        console.log(
            `${'Mechanism'.padEnd(maxMechLen)} | ` +
            `${'Scenario'.padEnd(maxScenLen)} | ` +
            `Duration (ns)`
        );
        console.log('-'.repeat(maxMechLen + maxScenLen + 35));

        // Print results
        this.results.forEach((result) => {
            console.log(
                `${result.mechanism.padEnd(maxMechLen)} | ` +
                `${result.scenario.padEnd(maxScenLen)} | ` +
                `${toPaddedString(result.averageNs, 10)} |`
            );
        });
    }
}

class FfiBenchmark extends BenchmarkBase {
    register(scenario: string, idlize1: BenchmarkFunction, idlize2: BenchmarkFunction, idlize3: BenchmarkFunction, idlize4: BenchmarkFunction, idlize5: BenchmarkFunction): void {
        this.registerRunner("idlize1", scenario, idlize1);
        this.registerRunner("idlize2", scenario, idlize2);
        this.registerRunner("idlize3", scenario, idlize3);
        this.registerRunner("idlize4", scenario, idlize4);
        this.registerRunner("idlize5", scenario, idlize5);
    }
}

namespace raw {
    export const STRING_128 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    export const STRING_128_UNICODE = "０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ０１２３４５６７８９ａｂｃｄｅｆ";

    export function testPutString(x: string) {}
    export function testGetString(): string { return "x"; }
    export function testGetString128(): string { return STRING_128; }
    export function testGetString128Unicode(): string { return STRING_128_UNICODE; }

    export function testConcatString(x: string, y: string): string { return x + y; }
}

class OptionInner implements idl.Option {
    src: string = "option";
    dest: number = 0;
    files: Array<string> = new Array<string>();
    // maps: Record<string, number> = new Record<String, number>();

    constructor() {
        this.files.push("aa");
        this.files.push("bb");
        // this.maps.set("cc", 100);
    }
};

let op = new OptionInner();
let str = "hello";

function benchmarkRegisterString(bench: FfiBenchmark) {
    bench.register('prim',
        () => { idl.optionPrim(5) },
        () => { idl.optionPrim(5) },
        () => { idl.optionPrim(5) },
        () => { idl.optionPrim(5) },
        () => { idl.optionPrim(5); }
    );
    bench.register('op1',
        () => { idl.optionArg1(str, op) },
        () => { idl.optionArg1(str, op) },
        () => { idl.optionArg1(str, op) },
        () => { idl.optionArg1(str, op) },
        () => { idl.optionArg1(str, op); }
    );

    bench.register('op2',
        () => { idl.optionArg2(str, op, op) },
        () => { idl.optionArg2(str, op, op) },
        () => { idl.optionArg2(str, op, op) },
        () => { idl.optionArg2(str, op, op) },
        () => { idl.optionArg2(str, op, op); }
    );

    bench.register('op3',
        () => { idl.optionArg3(str, op, op, op) },
        () => { idl.optionArg3(str, op, op, op) },
        () => { idl.optionArg3(str, op, op, op) },
        () => { idl.optionArg3(str, op, op, op) },
        () => { idl.optionArg3(str, op, op, op); }
    );

    // bench.register('string/put/1',
    //     () => { raw.testPutString("x") },
    //     () => { idl.testPutString("x"); }
    // );

    // bench.register('string/get/1',
    //     () => { raw.testGetString() },
    //     () => { idl.testGetString() },
    // );

    // bench.register('string/get/128',
    //     () => { raw.testGetString128() },
    //     () => { idl.testGetString128() },
    // );

    // bench.register('string/put/128',
    //     () => { raw.testPutString(raw.STRING_128) },
    //     () => { idl.testPutString(raw.STRING_128) },
    // );

    // bench.register('string/get/128+unicode',
    //     () => { raw.testGetString128Unicode() },
    //     () => { idl.testGetString128Unicode() },
    // );

    // bench.register('string/put/128+unicode',
    //     () => { raw.testPutString(raw.STRING_128_UNICODE) },
    //     () => { idl.testPutString(raw.STRING_128_UNICODE) },
    // );

    // bench.register('string/concat/128',
    //     () => { raw.testConcatString(raw.STRING_128, raw.STRING_128) },
    //     () => { idl.testConcatString(raw.STRING_128, raw.STRING_128) },
    // );

    // bench.register('string/concat/128+unicode',
    //     () => { raw.testConcatString(raw.STRING_128_UNICODE, raw.STRING_128_UNICODE) },
    //     () => { idl.testConcatString(raw.STRING_128_UNICODE, raw.STRING_128_UNICODE) },
    // );
}

export function runAll() {
    const bench = new FfiBenchmark();
    benchmarkRegisterString(bench);

    bench.runAll();
    bench.printResults();
}
