import { pullEvents, init } from "./compat"
import { run } from "../app"

export function main(): void {
    init()
    run()
    pullEvents()
}