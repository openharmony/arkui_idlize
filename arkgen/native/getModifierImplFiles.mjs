import { argv } from 'process'
import glob from 'glob'
import * as path from "node:path"

if (argv.length < 3) {
    console.log("Warning : please input your cpp directory.")
    process.exit()
}

let dir = argv[2]
let sources = glob.sync(dir + '/*cpp', { cwd: path.resolve('.') })

console.log(`${sources}`)