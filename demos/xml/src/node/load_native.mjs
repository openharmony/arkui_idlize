import { dlopen } from "node:process"
import { constants } from "node:os"
import { fileURLToPath } from "node:url"

const module = { exports: {} }
dlopen(module, fileURLToPath(new URL('Xml_NativeBridgeNapi.node', import.meta.url)), constants.dlopen.RTLD_NOW)

export default module.exports