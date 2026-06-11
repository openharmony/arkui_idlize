package idlize

public func run() {
    println("Mediaquery test app")
    let listener = MediaQueryListenerInternal()
    listener.onChange({ result => println("MESSAGE FROM NATIVE: ${result.media}") })
    let n = getLong()
    println("sqr of ${n} is ${test(n)}")
}
