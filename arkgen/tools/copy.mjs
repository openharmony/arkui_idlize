import { readdirSync, cpSync, existsSync, mkdirSync, statSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";

function copy(from, to) {
    if (!existsSync(from)) {
        console.error(`<from-path>=${from} does not exists`)
        process.exit(1)
    }
    if (statSync(from).isDirectory()) {
        console.log(`copy directory content from ${from} to ${to}`)
        const files = readdirSync(from, { recursive: true })
        mkdirSync(to, { recursive: true })
        for (const file of files) {
            if (statSync(join(from, file)).isFile()) {
                if (existsSync(join(to, file))) {
                    rmSync(join(to, file))
                }
                mkdirSync(dirname(join(to, file)), { recursive: true })
                cpSync(join(from, file), join(to, file))
            }
        }
    } else {
        if (existsSync(to)) {
            console.error(`can not copy file "${from}" to "${to}": destination path is already exists`)
            process.exit(1)
        }
        console.log(`copy file ${from} to ${to}`)
        mkdirSync(dirname(to), { recursive: true })
        cpSync(from, to)
    }
}

const args = process.argv.slice(2)
if (args.length !== 2) {
    console.error('expected to have two arguments: `node copy.mjs <from-path> <to-path>`')
}
copy(args[0], args[1])