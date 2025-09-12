import { init, resize, resize3 } from "./compat";

export function main() {
    init()
    console.log('Starting demo: test_fqn')
    resize({
        numSize:   { numHeight:  8,   numWidth:  4 },
        intSize:   { intHeight: 18,   intWidth: 14 },
        floatSize: { floatHeight: 28.0, floatWidth: 24.0 },
    })
    resize3(
        { numHeight:  3,   numWidth:  6 },
        { intHeight: 13,   intWidth: 16 },
        { floatHeight: 0.23, floatWidth: 0.26 },
    )
}
