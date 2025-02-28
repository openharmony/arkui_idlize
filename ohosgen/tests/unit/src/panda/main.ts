import { pullEvents, init } from "./compat"
import { run } from "../app"
import { runPanda } from "./app_panda"

export function main() {
    init()
    run()
    runPanda()
    pullEvents()
}