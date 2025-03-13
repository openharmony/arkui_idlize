import { pullEvents, init } from "./compat"
import { run } from "../app"

export function main() {
    init()
    run()
    pullEvents()
}