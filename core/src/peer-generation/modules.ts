import { generatorConfiguration, ModuleConfiguration } from "../config"
import * as idl from "../idl"


const modulesCache = new Map<string, ModuleConfiguration>()

export function isInModule(node: idl.IDLNode, module: ModuleConfiguration): boolean
export function isInModule(packageName: string, module: ModuleConfiguration): boolean
export function isInModule(nodeOrPackage: idl.IDLNode | string, module: ModuleConfiguration): boolean {
    if (typeof nodeOrPackage === 'object')
        return isInModule(idl.getPackageName(nodeOrPackage), module)
    return module.packages.some(modulePackage => nodeOrPackage.startsWith(modulePackage))
}

export function isInExternalModule(node: idl.IDLNode): boolean {
    return getModuleFor(node).external ?? false
}

export function getModuleFor(node: idl.IDLNode): ModuleConfiguration
export function getModuleFor(packageName: string): ModuleConfiguration
export function getModuleFor(nodeOrPackage: idl.IDLNode | string): ModuleConfiguration {
    if (typeof nodeOrPackage === "object")
        return getModuleFor(idl.getPackageName(nodeOrPackage))
    const packageName = nodeOrPackage
    let module = modulesCache.get(packageName)
    if (module) return module
    module = getApplicableModuleFor(packageName)
    modulesCache.set(packageName, module)
    return module
}

function getApplicableModuleFor(packageName: string): ModuleConfiguration {
    const config = generatorConfiguration()
    const applicableModules = [...config.modules.values()].filter(module => isInModule(packageName, module))
    if (applicableModules.length === 0) {
        if (packageName === '') {
            console.error("WARNING: use current module for empty package")
            return currentModule()
        }
        if (packageName.startsWith(`idlize.`)) {
            return currentModule()
        }
        const modules = [...config.modules.keys()].map(it => `"${it}"`).join(", ")
        throw new Error(`Package "${packageName}" is not listed in any module.`
            + ` Add the "${packageName}" to the existed list of modules [${modules}] or new one in the configuration file`)

    }
    if (applicableModules.length > 1)
        throw new Error(`Package ${packageName} listed in ${applicableModules.length} packages: ${applicableModules.map(it => it.name).join(", ")}`)
    return applicableModules[0]
}

export function currentModule(): ModuleConfiguration {
    const conf = generatorConfiguration()
    const result = conf.modules.get(conf.moduleName)
    if (!result)
        throw new Error(`Can not determine current module configuration ${conf.moduleName}`)
    return result
}

export function isInCurrentModule(node: idl.IDLNode): boolean
export function isInCurrentModule(packageName: string): boolean
export function isInCurrentModule(nodeOrPackage: idl.IDLNode | string): boolean {
    // check the nodeOrPackage belongs to some module
    const module = typeof nodeOrPackage === 'string'
        ? getModuleFor(nodeOrPackage)
        : getModuleFor(nodeOrPackage)
    return generatorConfiguration().moduleName == module.name
}
