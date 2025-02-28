import { init, runEventLoop } from "./compat"
import { run } from "../app"
import { runNode } from "./app_node"

init()
runEventLoop()
run()
runNode()