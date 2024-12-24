import { loadLibraries } from "@koalaui/interop"
import { runEventLoop } from "./compat"
import { run } from "../app"
import * as path from "path"

loadLibraries([
    path.join(__dirname, "Xml_NativeBridgeNapi")
])
runEventLoop()
run()