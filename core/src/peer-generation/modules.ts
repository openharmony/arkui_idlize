import { generatorConfiguration, ModuleConfiguration } from "../config"
import * as idl from "../idl"

export function isInModule(node: idl.IDLNode, module: ModuleConfiguration): boolean
export function isInModule(packageName: string, module: ModuleConfiguration): boolean
export function isInModule(nodeOrPackage: idl.IDLNode | string, module: ModuleConfiguration): boolean {
    if (typeof nodeOrPackage === 'object')
        return isInModule(idl.getPackageName(nodeOrPackage), module)
    return module.packages.some(modulePackage => nodeOrPackage.startsWith(modulePackage))
}

export function getModuleFor(node: idl.IDLNode): ModuleConfiguration
export function getModuleFor(packageName: string): ModuleConfiguration
export function getModuleFor(nodeOrPackage: idl.IDLNode | string): ModuleConfiguration {
    if (typeof nodeOrPackage === "object")
        return getModuleFor(idl.getPackageName(nodeOrPackage))
    const packageName = nodeOrPackage
    const config = generatorConfiguration()
    const applicableModules = [...config.modules.values()].filter(module => isInModule(packageName, module))
    if (applicableModules.length === 0) {
        if (nodeOrPackage === '') {
            console.error("WARNING: use current module for empty package")
            return currentModule()
        }
        throw new Error(`Package ${packageName} is not listed in any module`)
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
    if (typeof nodeOrPackage === 'string')
        return isInModule(nodeOrPackage, currentModule())
    else
        return isInModule(nodeOrPackage, currentModule())
}
