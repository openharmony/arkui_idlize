import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { sep, join, dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const LOCKFILE = './postinstall.lock'
const FALLBACKS = {
    '@koalaui/libarkts': [ join('external', 'libarkts') ]
}

function lock(cb) {
    if (!existsSync(LOCKFILE)) {
        try {
            writeFileSync(LOCKFILE, '')
            cb()
        } catch (e) {
            throw e
        } finally {
            rmSync(LOCKFILE)
        }
    }
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
        if (deps[depName].startsWith('file:')) {
            let path = deps[depName].slice(5)
            if (!path.startsWith(`..${sep}`)) {
                path = `./${path}`
            }
            depsCmd.push(path)
        } else {
            depsCmd.push(`${depName}@${deps[depName]}`)
        }
    }
    if (depsCmd.length > 0) {
        const cmd = `npm i --no-save --ignore-scripts ${depsCmd.join(' ')}`
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

function correct_file_dependencies(deps) {
    const correctedDependencies = {}
    for (const depName in deps) {
        const version = deps[depName]
        if (version.startsWith('file:')) {
            const path = version.slice(5)
            if (!existsSync(path)) {
                console.log(`path '${path}' for dependency ${depName} does not exists, trying to use fallbacks...`)
                const fallbacks = FALLBACKS[depName] ?? []
                const validFallbacks = fallbacks.filter(it => existsSync(it) && statSync(it).isDirectory())
                if (validFallbacks.length === 0) {
                    throw new Error(`No fallback found for ${depName}. Tested ${fallbacks.map(it => `'${it}'`).join(`,`)}`)
                }
                const chosenFallback = validFallbacks[0]
                if (validFallbacks.length > 1) {
                    console.warn(`More that one fallbacks found for ${depName}: ${validFallbacks.map(it => `'${it}'`).join(`,`)}. Use '${chosenFallback}'`)
                }
                console.log(`Use fallback '${chosenFallback}' for dependency ${depName}`)
                correctedDependencies[depName] = `file:${chosenFallback}`
            }
        }
    }
    return correctedDependencies
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
            const version = extract_version(packageFilename, deps[depName])
            if (depName in collectedDependencies && collectedDependencies[depName] !== version) {
                throw new Error(`Dependency ${depName} has different version`)
            }
            collectedDependencies[depName] = version
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
    install_dependencies(collectedDependencies)
    return true
}

let exitCode = 0

lock(() => {
    try {
        emulate_workspaces()
    } catch (e) {
        console.error('failed workspaces emulation: ', e)
        exitCode = 1
        return
    }

    try {
        const collectedDependencies = collect_workspaces_dependencies()
        const dependenciesToCorrect = correct_file_dependencies(collectedDependencies)
        if (Object.keys(dependenciesToCorrect).length > 0) {
            console.log(`Correcting file dependencies`)
            install_dependencies(dependenciesToCorrect)
        }
    } catch (e) {
        console.error('failed file dependencies correction: ', e)
        exitCode = 1
        return
    }
})

process.exit(exitCode)