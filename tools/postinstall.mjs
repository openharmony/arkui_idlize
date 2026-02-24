import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { sep, join, dirname, resolve, relative } from 'node:path'
import { execSync } from 'node:child_process'

const ALTERNATIVES = {
    "@koalaui/libarkts": [ "file:../../../developtools/ace_ets2bundle/ets1.2/libarkts", "file:node_modules/@koalaui/libarkts" ]
}

function glob(path, allowFailure = false) {
    const sections = path.split(sep)
    for (const sectionIndex in sections) {
        if (sections[sectionIndex] == '*') {
            const prefixPath = sections.slice(0, sectionIndex).join(sep)
            const postfixPath = sections.slice(sectionIndex + 1).join(sep)
            if (!existsSync(prefixPath) || !statSync(prefixPath).isDirectory()) {
                return []
            }
            const paths = []
            for (const subpath of readdirSync(prefixPath)) {
                paths.push(...glob(join(prefixPath, subpath, postfixPath), true))
            }
            return paths
        }
    }
    if (!allowFailure && !existsSync(path)) {
        throw new Error(`Path ${path} does not exists`)
    }
    return [ path ]
}

function install_dependencies(deps) {
    const depsCmd = []
    for (const depName in deps) {
        depsCmd.push(`${depName}@${deps[depName]}`)
    }
    if (depsCmd.length > 0) {
        const registry = process.env.npm_config_registry
        const cache = process.env.npm_config_cache
        const npm = process.env.npm_execpath
        const registryFlag = registry ? `--registry ${registry}` : ``
        const cacheFlag = cache ? `--cache ${cache}` : ``
        const cmd = `${npm} i --no-save --ignore-scripts ${registryFlag} ${cacheFlag} ${depsCmd.join(' ')}`
        console.log(`> ${cmd}`)
        execSync(cmd, { stdio: 'inherit' })
    }
}

function extract_version(packageFilename, version) {
    function _extract_file_version(version) {
        return 'file:' + join(dirname(packageFilename), version)
    }
    if (version.startsWith('^')) {
        return version.slice(1)
    }
    if (version.startsWith('file:')) {
        return _extract_file_version(version.slice(5))
    }
    if (version.startsWith(`.${sep}`) || version.startsWith(`..${sep}`)) {
        return _extract_file_version(version)
    }
    return version
}

function collect_workspace_packages_filenames() {
    const rootPackage = JSON.parse(readFileSync('package.json'))
    const workspacePackagesFilenames = []
    for (const workspaceGlob of rootPackage.workspaces) {
        for (const workspace of glob(workspaceGlob)) {
            const workspacePackageFilename = join(workspace, 'package.json')
            if (!existsSync(workspacePackageFilename)) {
                console.error(`Can not find package for workspace ${workspace}`)
                continue
            }
            workspacePackagesFilenames.push(workspacePackageFilename)
        }
    }
    return workspacePackagesFilenames
}

function collect_workspaces_dependencies() {
    const collectedDependencies = {}
    const collectDependencies = (packageFilename, deps) => {
        for (const depName in deps) {
            const versionsAlternatives = deps[depName].split('||').map(it => it.trim())
                .map(it => extract_version(packageFilename, it))
                .concat(ALTERNATIVES[depName] ?? [])
                .filter(it => {
                    if (it.startsWith('file:')) {
                        return existsSync(it.slice(5))
                    }
                    return true
                })
            let chosenAlternative = undefined
            for (const version of versionsAlternatives) {
                if (depName in collectedDependencies && collectedDependencies[depName] !== version) {
                    continue
                }
                chosenAlternative = version
                break;
            }
            if (chosenAlternative === undefined) {
                throw new Error(`Dependency ${depName} has different version: ${versionsAlternatives.join(" || ")}`)
            }
            collectedDependencies[depName] = chosenAlternative
        }
    }
    const workspacePackagesFilenames = collect_workspace_packages_filenames()
    for (const workspacePackageFilename of workspacePackagesFilenames) {
        const workspacePackage = JSON.parse(readFileSync(workspacePackageFilename))
        if ('dependencies' in workspacePackage)
            collectDependencies(workspacePackageFilename, workspacePackage.dependencies)
        if ('devDependencies' in workspacePackage)
            collectDependencies(workspacePackageFilename, workspacePackage.devDependencies)
    }
    for (const workspacePackageFilename of workspacePackagesFilenames) {
        const workspacePackage = JSON.parse(readFileSync(workspacePackageFilename))
        if (workspacePackage.name in collectedDependencies) {
            console.log(`Use package ${workspacePackage.name} from workspace '${dirname(workspacePackageFilename)}'`)
            collectedDependencies[workspacePackage.name] = `file:${dirname(workspacePackageFilename)}`
        }
    }
    return collectedDependencies
}

function emulate_workspaces() {
    const node_major_version = Number.parseInt(process.versions.node.split('.')[0])
    if (node_major_version >= 16) {
        return false
    }

    console.log(`npm corresponding for node version ${process.versions.node} does not support workspaces, trying to emulate it with direct 'npm install'`)
    const collectedDependencies = collect_workspaces_dependencies()
    const replaceDependenciesToCollected = (packageFilename, deps) => {
        if (deps) {
            for (const depName in deps) {
                if (depName in collectedDependencies) {
                    let version = collectedDependencies[depName]
                    if (version.startsWith('file:')) {
                        version = 'file:' + relative(dirname(packageFilename), version.slice(5))
                    }
                    deps[depName] = version
                }
            }
        }
    }
    const workspacePackagesFilenames = collect_workspace_packages_filenames()
    const savedPackages = new Map()
    try {
        for (const workspacePackageFilename of workspacePackagesFilenames) {
            const workspacePackageContent = readFileSync(workspacePackageFilename, { encoding: 'utf-8' })
            savedPackages.set(workspacePackageFilename, workspacePackageContent)
            const workspacePackage = JSON.parse(workspacePackageContent)
            replaceDependenciesToCollected(workspacePackageFilename, workspacePackage.dependencies)
            replaceDependenciesToCollected(workspacePackageFilename, workspacePackage.devDependencies)
            writeFileSync(workspacePackageFilename, JSON.stringify(workspacePackage), { encoding: 'utf-8' })
        }
        install_dependencies(collectedDependencies)
    } finally {
        for (const [ workspacePackageFilename, workspacePackageContent ] of savedPackages.entries()) {
            writeFileSync(workspacePackageFilename, workspacePackageContent, { encoding: 'utf-8' })
        }
    }
    return true
}

function main() {
    try {
        if (emulate_workspaces())
            return 0
    } catch (e) {
        console.error('failed workspaces emulation: ', e)
        return 1
    }

    try {
        const collectedDependencies = collect_workspaces_dependencies()
        const fileDependencies = {}
        for (const depName in collectedDependencies) {
            const version = collectedDependencies[depName]
            if (version.startsWith('file:')) {
                fileDependencies[depName] = version
            }
        }
        install_dependencies(fileDependencies)
    } catch (e) {
        console.error('failed files correction: ', e)
        return 1
    }
}

process.exit(main())