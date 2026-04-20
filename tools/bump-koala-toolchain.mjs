/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { Command } from "commander"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")
const execFileAsync = promisify(execFile)

const DEP_SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]
const SKIP_PACKAGES = new Set([])
const MANAGED_PACKAGE_POLICY = {
    exact: new Set([]),
    prefixes: ["@koalaui/"],
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function exists(filePath) {
    return fs.existsSync(filePath)
}

function expandWorkspacePattern(rootDir, workspacePattern) {
    const parts = workspacePattern.split("/").filter((p) => p.length > 0)
    const results = []

    function walk(base, index) {
        if (index >= parts.length) {
            const rel = path.relative(rootDir, base)
            if (rel && rel !== ".") {
                results.push(rel.replace(/\\/g, "/"))
            }
            return
        }

        const token = parts[index]

        if (token === "*") {
            if (!exists(base) || !fs.statSync(base).isDirectory()) {
                return
            }
            const children = fs.readdirSync(base)
            for (const child of children) {
                const childPath = path.join(base, child)
                if (exists(childPath) && fs.statSync(childPath).isDirectory()) {
                    walk(childPath, index + 1)
                }
            }
            return
        }

        walk(path.join(base, token), index + 1)
    }

    walk(rootDir, 0)
    return results
}

function discoverProjects(rootDir) {
    const rootPackagePath = path.join(rootDir, "package.json")
    const rootPackage = readJson(rootPackagePath)
    const workspaces = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : []

    const discovered = []
    for (const workspace of workspaces) {
        discovered.push(...expandWorkspacePattern(rootDir, workspace))
    }

    const relPaths = [...new Set(discovered)]
    const projects = []

    for (const relPath of relPaths) {
        const packagePath = path.join(rootDir, relPath, "package.json")
        if (!exists(packagePath)) {
            continue
        }

        const pkg = readJson(packagePath)
        projects.push({
            name: typeof pkg.name === "string" ? pkg.name : relPath,
            relPath,
            gradlePath: `:${relPath.split("/").join(":")}`,
            packagePath,
            json: pkg,
        })
    }

    return projects
}

function isManagedPackageName(name) {
    if (MANAGED_PACKAGE_POLICY.exact.has(name)) {
        return true
    }

    return MANAGED_PACKAGE_POLICY.prefixes.some((prefix) => name.startsWith(prefix))
}

function isManagedDependency(name, versionSpec) {
    if (SKIP_PACKAGES.has(name)) {
        return false
    }

    if (!isManagedPackageName(name)) {
        return false
    }

    if (typeof versionSpec !== "string") {
        return false
    }

    if (
        versionSpec === "*" ||
        versionSpec.startsWith("file:") ||
        versionSpec.startsWith("link:") ||
        versionSpec.startsWith("workspace:") ||
        versionSpec.startsWith("git+") ||
        versionSpec.startsWith("http:") ||
        versionSpec.startsWith("https:") ||
        versionSpec.startsWith("npm:")
    ) {
        return false
    }

    return true
}

function collectDependencyRefs(project) {
    const refs = []

    for (const section of DEP_SECTIONS) {
        const deps = project.json[section]
        if (!deps || typeof deps !== "object") {
            continue
        }

        for (const [name, spec] of Object.entries(deps)) {
            if (!isManagedDependency(name, spec)) {
                continue
            }

            refs.push({
                section,
                name,
                currentSpec: spec,
            })
        }
    }

    return refs
}

async function npmViewVersion(packageName, selector) {
    const target = `${packageName}@${selector}`
    const { stdout } = await execFileAsync("npm", ["view", target, "version", "--json"], {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
    })

    const parsed = JSON.parse(stdout)
    if (typeof parsed === "string" && parsed.length > 0) {
        return parsed
    }

    if (Array.isArray(parsed) && typeof parsed[0] === "string" && parsed[0].length > 0) {
        return parsed[0]
    }

    throw new Error(`unexpected npm response for ${target}: ${stdout.trim()}`)
}

function updateProjectFile(project, refs, resolvedVersions, dryRun, force) {
    let updated = false
    const nextJson = project.json

    for (const ref of refs) {
        const nextVersion = resolvedVersions.get(ref.name)
        if (!nextVersion) {
            continue
        }

        if (nextJson[ref.section][ref.name] !== nextVersion) {
            nextJson[ref.section][ref.name] = nextVersion
            updated = true
            continue
        }

        if (force) {
            updated = true
        }
    }

    if (updated && !dryRun) {
        fs.writeFileSync(project.packagePath, `${JSON.stringify(nextJson, null, 4)}\n`)
    }

    return updated
}

async function main() {
    const cli = new Command()

    cli
        .name("bump-koala-toolchain")
        .description("Bump all managed koala versions across workspace projects")
        .argument("[version]", "Set tag/version for all managed dependencies (default: panda-next)")
        .option("-r, --resolve", "Resolve specified tag via npm and use the concrete published version")
        .option("-n, --dry-run", "Print planned changes without writing files")
        .option("-f, --force", "Force rewrite even when versions already match")
        .addHelpText(
            "after",
            [
                "",
                "Examples:",
                "  node tools/bump-koala-toolchain.mjs",
                "  node tools/bump-koala-toolchain.mjs 1.5.0-dev.68195-8888",
                "  node tools/bump-koala-toolchain.mjs --dry-run --resolve",
            ].join("\n"),
        )

    cli.parse(process.argv)
    const options = cli.opts()
    const requestedVersion = cli.args[0] || "panda-next"

    const discovered = discoverProjects(repoRoot)
    if (discovered.length === 0) {
        console.log("No workspace projects discovered. Nothing to do.")
        return
    }

    const allRefs = []
    for (const project of discovered) {
        const refs = collectDependencyRefs(project)
        allRefs.push({ project, refs })
    }

    const usedPackageNames = [...new Set(allRefs.flatMap((entry) => entry.refs.map((r) => r.name)))].sort()
    if (usedPackageNames.length === 0) {
        console.log("No managed dependencies found in selected projects. Nothing to do.")
        return
    }

    const resolvedVersions = new Map()

    if (!options.resolve) {
        for (const packageName of usedPackageNames) {
            resolvedVersions.set(packageName, requestedVersion)
        }
    } else {
        const results = await Promise.allSettled(
            usedPackageNames.map(async (packageName) => {
                try {
                    const version = await npmViewVersion(packageName, requestedVersion)
                    return { packageName, version }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error)
                    throw new Error(`${packageName}@${requestedVersion}: ${message}`)
                }
            }),
        )

        const failures = []
        for (const result of results) {
            if (result.status === "rejected") {
                failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason))
                continue
            }

            resolvedVersions.set(result.value.packageName, result.value.version)
        }

        if (failures.length > 0) {
            console.error(`Failed to resolve ${failures.length} package(s) for selector \"${requestedVersion}\":`)
            for (const failure of failures.sort((a, b) => a.localeCompare(b))) {
                console.error(`  - ${failure}`)
            }
            process.exit(1)
        }
    }

    let changedProjects = 0
    let scannedProjectsWithManagedDeps = 0
    let changedRefs = 0

    console.log(`Discovered ${discovered.length} workspace project(s).`)

    console.log(`Version source: ${options.resolve ? `resolved from ${requestedVersion}` : `unresolved ${requestedVersion}`}`)
    console.log("Resolved package versions:")
    for (const [pkg, version] of [...resolvedVersions.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        console.log(`  ${pkg} -> ${version}`)
    }

    for (const { project, refs } of allRefs) {
        if (refs.length === 0) {
            continue
        }

        scannedProjectsWithManagedDeps += 1

        let projectChanges = 0
        for (const ref of refs) {
            const next = resolvedVersions.get(ref.name)
            if (!next) {
                continue
            }

            const isSame = next === ref.currentSpec
            if (isSame && !options.force) {
                continue
            }

            projectChanges += 1
            const op = options.dryRun
                ? (isSame ? "PLAN-FORCE" : "PLAN")
                : (isSame ? "FORCE" : "UPDATE")
            console.log(`${op} ${project.relPath} ${ref.section}.${ref.name}: ${ref.currentSpec} -> ${next}`)
        }

        if (projectChanges > 0) {
            const updated = updateProjectFile(project, refs, resolvedVersions, Boolean(options.dryRun), Boolean(options.force))
            if (updated) {
                changedProjects += 1
                changedRefs += projectChanges
            }
        }
    }

    console.log(
        `${options.dryRun ? "Dry run complete" : "Done"}: scanned ${scannedProjectsWithManagedDeps} project(s) with managed deps, ${changedRefs} dependency entries ${options.dryRun ? "would be updated" : "updated"} across ${changedProjects} project(s).`,
    )
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
})
