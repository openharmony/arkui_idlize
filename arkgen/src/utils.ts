
export function zipMany<T>(...xs:T[][]): Array<Array<T | undefined>> {
    const max = xs.reduce((max, it) => it.length > max ? it.length : max, 0)
    const result:Array<Array<T | undefined>> = []
    for (let i = 0; i < max; ++i) {
        const row: Array<undefined | T> = []
        for (const x of xs) {
            const element = i < x.length
                ? x[i]
                : undefined
            row.push(element)
        }
        result.push(row)
    }
    return result
}
