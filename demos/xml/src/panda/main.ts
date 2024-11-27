import { pullEvents } from "./compat"
import { run } from "../app"

export function main() {
    run()
    pullEvents()
}