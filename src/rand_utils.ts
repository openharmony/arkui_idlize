/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let rand: XorRand|undefined = undefined

const MASK = 0x7FFFFFFF

export function initRNG() {
    let seed: number

    console.log(`Use  IDLIZE_SEED env variable to set a seed value.`)
    console.log(`Set  IDLIZE_SEED env variable to RANDOM to use a random seed value.`)
    console.log(`IDLIZE_SEED=${process.env.IDLIZE_SEED}`)

    if (process.env.IDLIZE_SEED === undefined) {
        seed = 29
        console.log(`Env IDLIZE_SEED variable is not.`)
        console.log(`Use predefined seed: ${seed}.`)
    } else if (process.env.IDLIZE_SEED == "RANDOM") {
        seed = Math.floor(Math.random() * 4096)
        console.log(`Use random seed: ${seed}`)
    } else {
        seed = Number(process.env.IDLIZE_SEED)
        console.log(`Use seed: ${seed}`)
    }

    rand = new XorRand(seed)
}

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


export function randInt(max: number, min: number = 0) {
    return Math.floor(rand!.random() * (max - min)) + min;
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

export function pick<K, V>(keys: K[], gen: (key: K) => string[], pickedNumbers: number = 3): string[] {

    let values: string[][] = keys.map(it => gen(it))
    let picked: string[] = []

    if (values.map(it => it.length).some(it => it == 0)) {
        console.log("Empty arguments!")
        return []
    }

    for (let _ = 0; _ < pickedNumbers; _++) {
        let v = []
        for (let i = 0; i < values.length; i++) {
            let len = values[i].length
            let index = randInt(len)
            let elem = values[i][index]
            v.push(elem)
        }
        picked.push(v.join(", "))
    }

    return [...new Set(picked)]
}

export function pickArray<T>(values: T[], maxLen: number, pickedNumbers: number = 3): string[] {

    let picked: string[] = ["[]"]

    for (let _ = 0; _ < pickedNumbers; _++) {
        let len = randInt(maxLen)
        let p: T[] = []
        for (let i = 0; i < len; i++) {
            p.push(values[randInt(values.length)])
        }
        picked.push(`[${p.join(", ")}]`)
    }

    return [...new Set(picked)]
}