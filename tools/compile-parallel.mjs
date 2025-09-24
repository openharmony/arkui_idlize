import util from "node:util"
import { exit } from "node:process";
import { exec } from "child_process";
import path from "path"
import { all_packages, Package, IDLIZE_HOME } from "./utils.mjs";

const execAsync = util.promisify(exec)

const packagesToCompile = all_packages.concat(
    new Package(path.join(IDLIZE_HOME, "external/libarkts"))
)
const preCompileScripts = {
    // "@koalaui/libarkts": "npm run reinstall:regenerate"
}

function computePackagesDependencies(packages) {
    const dependencies = new Map
    for (const pack of packages) {
        const deps = pack.read("dependencies") ?? {}
        const devDeps = pack.read("devDependencies") ?? {}
        const packDependencies = {
            ...deps,
            ...devDeps,
        }
        dependencies.set(pack, packages.filter(it => {
            return (it.read("name") ?? "") in packDependencies
        }))
    }
    return dependencies
}

function compileCommand(pack) {
    const name = pack.read("name")
    const scripts = pack.read("scripts") ?? {}
    const preCompileScript = name in preCompileScripts ? preCompileScripts[name] + " && " : ""
    const compileScript = "compile:self" in scripts ? "compile:self" : "compile"
    return `${preCompileScript}npm run ${compileScript} -C ${pack.path}`
}

function compileParallel(dependenciesMap, launched = [], finished = []) {
    let runningPromises = []
    for (const pack of dependenciesMap.keys()) {
        if (launched.includes(pack) || !dependenciesMap.get(pack).every(it => finished.includes(it))) {
            continue
        }
        launched.push(pack)
        runningPromises.push(execAsync(compileCommand(pack), { cwd: pack.path }).then(({error, stdout, stderr}) => {
            console.log(stdout)
            console.error(stderr)
            finished.push(pack)
            if (error) {
                throw error
            }
            return compileParallel(dependenciesMap, launched, finished)
        }))
    }
    return Promise.all(runningPromises)
}

compileParallel(computePackagesDependencies(packagesToCompile)).then(() => {
    console.log("All packages compiled")
}, (error) => {
    console.error(error.toString())
    if (error.stdout)
        console.error(error.stdout)
    console.error("Failed to compile packages")
    exit(1)
})