const MASK = 0x7FFFFFFF
const SEED = 29
// const SEED = Math.floor(Math.random() * MASK)

console.log(`Random seed: ${SEED}`)
console.log(`Set the custom seed in the file rand_utils.ts`)
console.log(`  to generate fuzzing tests with different input values:`)
console.log(`  const SEED = ${SEED}`)

class XorRand {

    private seed

    constructor(seed: number) {
        this.seed = seed
    }

    random(): number {
        let x = this.seed
        x ^= (x << 13) & MASK;
        x ^= (x >> 17) & MASK;
        x ^= (x << 5) & MASK;
        this.seed = x
        return x / MASK
    }
}

const rand = new XorRand(SEED)

export function randInt(max: number, min: number = 0) {
    return Math.floor(rand.random() * (max - min)) + min;
}

function randChar(minChar: string, range: number) {
    return String.fromCharCode(minChar.charCodeAt(0) + randInt(range))
}

export function randString(max: number): string {

    let array: string[] = []
    for (let i = 0; i < max; i++) {
        const range = randInt(3)
        let c = (range == 0)
            ? randChar('0', 10)
            : (range == 1)
                ? randChar('a', 26)
                : randChar('A', 26)
        array.push(c)
    }

    return array.join('')
}