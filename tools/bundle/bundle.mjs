/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { basename, join, parse, resolve } from 'node:path'
import {
    Package,
    IDLIZE_HOME,
    external_packages,
    idlize_packages,
} from '../utils.mjs'

const all_packages = [
    ...external_packages,
    ...idlize_packages,
]
const koalaui_dependencies = [
    "@koalaui/compat",
    "@koalaui/common",
    "@koalaui/interop",
    "@koalaui/libarkts"
]
const idlizer_dependencies = [
    "@idlizer/core",
    "@idlizer/interfaces",
    "@idlizer/libohos",
    "@idlizer/etsgen",
    "@idlizer/arkgen",
    "@idlizer/runner"
]

function findPackage(name, packages) {
    const pkg = packages.find(it => it.name() === name)
    if (!pkg) {
        throw new Error(`Package ${name} is not available for bundling`)
    }
    return pkg
}

function mangleVersion(version, manglePanda) {
    if (manglePanda) {
        const pandaSdk = new Package(process.env.PANDA_SDK_PATH ?? join(IDLIZE_HOME, './external/incremental/tools/panda/node_modules/@panda/sdk'))
        const pandaVersion = pandaSdk.version()
        return `${version}-panda-${pandaVersion}`
    }
    return version
}

function applyVersions(dependencies, versions, packages) {
    for (const dependency of dependencies) {
        const pkg = findPackage(dependency, packages)
        pkg.write('version', versions[pkg.name()])
        for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
            const subDependencies = pkg.read(field)
            if (subDependencies) {
                for (const subDependency in subDependencies) {
                    if (!(subDependency in versions))
                        continue
                    subDependencies[subDependency] = versions[subDependency]
                }
                pkg.write(field, subDependencies)
            }
        }
    }
}

export function bundle(bundleVersion, bundleOut, options) {
    bundleOut = resolve(process.env.IDLIZE_BUNDLE_OUT ?? bundleOut ?? join(IDLIZE_HOME, "bundle"))

    if (bundleOut === parse(bundleOut).root || bundleOut === IDLIZE_HOME ||
        existsSync(join(bundleOut, 'package.json'))) {
        throw new Error(`Refusing to clean unsafe bundle output directory: ${bundleOut}`)
    }

    if (options.idlizerOnly && !options.koalauiVersion) {
        throw new Error('koalaui packages were not selected and their version is not specified')
    }

    const newVersion = mangleVersion(bundleVersion, options.pandaVersion)
    const allDependencies = [
        ...koalaui_dependencies,
        ...idlizer_dependencies,
    ]
    const bundlableDependencies = options.idlizerOnly ? idlizer_dependencies : allDependencies
    const availablePackages = options.idlizerOnly ? idlize_packages : all_packages
    const packageSnapshots = allDependencies.flatMap(dep => {
        if (options.idlizerOnly && koalaui_dependencies.includes(dep)) {
            return []
        }
        const pkg = findPackage(dep, availablePackages)
        return [{
            snapshot: pkg.snapshot(),
            package: pkg
        }]
    })
    const newVersions = allDependencies.reduce((versions, dep) => {
        versions[dep] = (options.idlizerOnly && koalaui_dependencies.indexOf(dep) >= 0) ?
            options.koalauiVersion :
            newVersion
        return versions
    }, {})
    try {
        applyVersions(bundlableDependencies, newVersions, availablePackages)
        console.log("Compiling dependencies..")
        bundlableDependencies.forEach(dep => {
            const pkg = findPackage(dep, availablePackages)
            console.log(`compiling ${pkg.name()}..`)
            pkg.compile()
        })

        console.log("Packing..")
        rmSync(bundleOut, { recursive: true, force: true })
        mkdirSync(bundleOut, { recursive: true })
        bundlableDependencies.forEach(dep => {
            const pkg = findPackage(dep, availablePackages)
            console.log(`packing ${pkg.name()}..`)
            const packPath = pkg.pack()
            copyFileSync(packPath, join(bundleOut, basename(packPath)))
            rmSync(packPath)
        })
        const outputFiles = readdirSync(bundleOut).sort()
        if (outputFiles.length !== bundlableDependencies.length ||
            outputFiles.some(file => !file.endsWith('.tgz'))) {
            throw new Error(`Unexpected bundle contents: ${outputFiles.join(', ')}`)
        }

        console.log(`All done! Bundle saved to ${bundleOut}`)
    } finally {
        packageSnapshots.forEach(record => {
            record.package.restore(record.snapshot)
        })
    }
}
