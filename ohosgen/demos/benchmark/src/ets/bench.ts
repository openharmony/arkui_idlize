import { Chrono } from "std/time"
import { mediaquery as idl } from '#compat'

namespace performance {
    export function now(): number {
        return Chrono.nanoNow()
    }
}

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
                `${StringBuilder.toString(result.averageNs as long).padLeft(' ', 10)} |`
            );
        });
    }
}

class FfiBenchmark extends BenchmarkBase {
    register(scenario: string, f_baseline: BenchmarkFunction, f_idl: BenchmarkFunction, f_ani?: BenchmarkFunction): void {
        this.registerRunner("baseline", scenario, f_baseline);
        this.registerRunner("idlize", scenario, f_idl);
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

function benchmarkRegisterString(bench: FfiBenchmark) {
    bench.register('string/put/1',
        () => { raw.testPutString("x") },
        () => { idl.testPutString("x"); }
    );

    bench.register('string/get/1',
        () => { raw.testGetString() },
        () => { idl.testGetString() },
    );

    bench.register('string/get/128',
        () => { raw.testGetString128() },
        () => { idl.testGetString128() },
    );

    // bench.registerRunner('ani', 'promise/string/int', 
    //     () => { setTimeout(new Promise()) }
    // )

    bench.register('string/put/128',
        () => { raw.testPutString(raw.STRING_128) },
        () => { idl.testPutString(raw.STRING_128) },
    );

    bench.register('string/get/128+unicode',
        () => { raw.testGetString128Unicode() },
        () => { idl.testGetString128Unicode() },
    );

    bench.register('string/put/128+unicode',
        () => { raw.testPutString(raw.STRING_128_UNICODE) },
        () => { idl.testPutString(raw.STRING_128_UNICODE) },
    );

    bench.register('string/concat/128',
        () => { raw.testConcatString(raw.STRING_128, raw.STRING_128) },
        () => { idl.testConcatString(raw.STRING_128, raw.STRING_128) },
    );

    bench.register('string/concat/128+unicode',
        () => { raw.testConcatString(raw.STRING_128_UNICODE, raw.STRING_128_UNICODE) },
        () => { idl.testConcatString(raw.STRING_128_UNICODE, raw.STRING_128_UNICODE) },
    );
}

export function runAll() {
    const bench = new FfiBenchmark();
    benchmarkRegisterString(bench);

    bench.runAll();
    bench.printResults();
}
