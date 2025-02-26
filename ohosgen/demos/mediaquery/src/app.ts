import { getLong, mediaquery } from '#compat'

export function run() {
    console.log(`Mediaquery test app`)
    const listener = new mediaquery.MediaQueryListenerInternal()
    listener.onChange((result) => { console.log("MESSAGE FROM NATIVE: " + result.media) })
    const n = getLong()
    console.log(`sqr of ${n} is ${mediaquery.test(n)}`)
}
