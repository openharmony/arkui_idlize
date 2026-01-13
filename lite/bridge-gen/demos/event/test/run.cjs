const { EventEmitter } = require("event")
const { receiveEvents } = require("@idlizer/runtime")

function main() {
    const emitter = EventEmitter.getOne()
    emitter.setHandler((event) => {
        console.log('Received event', event)
    })
    emitter.emit()
    receiveEvents()
}
main()
