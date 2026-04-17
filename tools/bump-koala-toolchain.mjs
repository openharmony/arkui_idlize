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
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { Command } from "commander"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const EXTRA_PROJECTS = ["codecheck_fixer"]
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

function normalizePatterns(patterns) {
    const out = []
    for (const pattern of patterns || []) {
        for (const part of String(pattern).split(",")) {
            const normalized = part.trim()
            if (normalized.length > 0) {
                out.push(normalized)
            }
        }
    }
    return out
}

function escapeRegExp(value) {
    return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
}

function globToRegExp(pattern) {
    const placeholder = "__DOUBLE_STAR__"
    const escaped = escapeRegExp(pattern).replace(/\*\*/g, placeholder)
    const withSingle = escaped.replace(/\*/g, "[^/:]*").replace(/\?/g, "[^/:]")
    const withDouble = withSingle.replace(new RegExp(placeholder, "g"), ".*")
    return new RegExp(`^${withDouble}$`)
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

    const relPaths = [...new Set([...discovered, ...EXTRA_PROJECTS])]
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

function matchesProject(project, patternRegex, rawPattern) {
    if (rawPattern.startsWith(":")) {
        return patternRegex.test(project.gradlePath)
    }

    if (rawPattern.startsWith("@")) {
        return patternRegex.test(project.name)
    }

    return patternRegex.test(project.relPath) || patternRegex.test(project.gradlePath) || patternRegex.test(project.name)
}

function selectProjects(projects, includePatterns, excludePatterns) {
    const includeRegexes = includePatterns.map((p) => ({ raw: p, regex: globToRegExp(p) }))
    const excludeRegexes = excludePatterns.map((p) => ({ raw: p, regex: globToRegExp(p) }))

    const selected = projects.filter((project) => {
        const includeOk = includeRegexes.length === 0 || includeRegexes.some((p) => matchesProject(project, p.regex, p.raw))
        if (!includeOk) {
            return false
        }

        const excluded = excludeRegexes.some((p) => matchesProject(project, p.regex, p.raw))
        return !excluded
    })

    return selected
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

function npmViewVersion(packageName, selector) {
    const target = `${packageName}@${selector}`
    const stdout = execFileSync("npm", ["view", target, "version", "--json"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    })

    const parsed = JSON.parse(stdout)
    if (typeof parsed !== "string" || parsed.length === 0) {
        throw new Error(`Unexpected npm response for ${target}: ${stdout}`)
    }

    return parsed
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

function main() {
    const cli = new Command()

    cli
        .name("bump-koala-toolchain")
        .description("Bump arkui_idlize managed koala/ui2abc versions across workspace projects")
        .argument("[version]", "Set exact version for all managed dependencies")
        .option("--stable", "Use `panda-latest` tag instead of default `panda-next`")
        .option("-i, --include <pattern>", "Include projects by pattern (repeatable, supports comma-separated)", (v, acc) => {
            acc.push(v)
            return acc
        }, [])
        .option("-x, --exclude <pattern>", "Exclude projects by pattern (repeatable, supports comma-separated)", (v, acc) => {
            acc.push(v)
            return acc
        }, [])
        .option("-n, --dry-run", "Print planned changes without writing files")
        .option("-f, --force", "Force rewrite even when versions already match")
        .option("-v, --verbose", "Print project selection and unchanged refs")
        .addHelpText(
            "after",
            [
                "",
                "Pattern matching:",
                "  * matches within one segment (no '/' or ':')",
                "  ** matches across segments",
                "  ? matches one character",
                "",
                "Pattern target:",
                "  If pattern starts with '@' => matches package name, e.g. @idlizer/*",
                "  If pattern starts with ':' => matches Gradle-style project path, e.g. :ohosgen:tests:unit",
                "  Otherwise => matches project rel path/name/gradle path",
                "",
                "Examples:",
                "  node tools/bump-koala-toolchain.mjs",
                "  node tools/bump-koala-toolchain.mjs --stable",
                "  node tools/bump-koala-toolchain.mjs 1.5.0-dev.68195-8888",
                "  node tools/bump-koala-toolchain.mjs --include ':ohosgen:**' --exclude ':ohosgen:demos:*'",
                "  node tools/bump-koala-toolchain.mjs --include ohosgen/tests/unit,arkgen/tests/unit",
            ].join("\n"),
        )

    cli.parse(process.argv)
    const options = cli.opts()
    const explicitVersion = cli.args[0] || null

    if (options.stable && explicitVersion) {
        console.error("Error: --stable and positional <version> are mutually exclusive")
        process.exit(2)
    }

    const includePatterns = normalizePatterns(options.include)
    const excludePatterns = normalizePatterns(options.exclude)

    const selector = explicitVersion ? null : (options.stable ? "panda-latest" : "panda-next")

    const discovered = discoverProjects(repoRoot)
    const selected = selectProjects(discovered, includePatterns, excludePatterns)

    if (selected.length === 0) {
        console.log("No projects matched include/exclude filters. Nothing to do.")
        return
    }

    const allRefs = []
    for (const project of selected) {
        const refs = collectDependencyRefs(project)
        allRefs.push({ project, refs })
    }

    const usedPackageNames = [...new Set(allRefs.flatMap((entry) => entry.refs.map((r) => r.name)))].sort()
    if (usedPackageNames.length === 0) {
        console.log("No managed dependencies found in selected projects. Nothing to do.")
        return
    }

    const resolvedVersions = new Map()

    if (explicitVersion) {
        for (const packageName of usedPackageNames) {
            resolvedVersions.set(packageName, explicitVersion)
        }
    } else {
        for (const packageName of usedPackageNames) {
            try {
                const version = npmViewVersion(packageName, selector)
                resolvedVersions.set(packageName, version)
            } catch (error) {
                console.error(`Failed to resolve ${packageName}@${selector}: ${error.message}`)
                process.exit(1)
            }
        }
    }

    let changedProjects = 0
    let scannedProjectsWithManagedDeps = 0
    let changedRefs = 0

    if (options.verbose) {
        console.log(`Discovered ${discovered.length} projects, selected ${selected.length}.`)
        for (const project of selected) {
            console.log(`- ${project.relPath} (${project.name}, ${project.gradlePath})`)
        }
    }

    console.log(`Version source: ${explicitVersion ? `explicit ${explicitVersion}` : selector}`)
    console.log("Resolved package versions:")
    for (const [pkg, version] of [...resolvedVersions.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        console.log(`  ${pkg} -> ${version}`)
    }

    for (const { project, refs } of allRefs) {
        if (refs.length === 0) {
            if (options.verbose) {
                console.log(`SKIP ${project.relPath}: no managed deps`)
            }
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
                if (options.verbose) {
                    console.log(`UNCHANGED ${project.relPath} ${ref.section}.${ref.name}: ${ref.currentSpec}`)
                }
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
        `${options.dryRun ? "Dry run complete" : "Done"}: selected ${selected.length} project(s), scanned ${scannedProjectsWithManagedDeps} with managed deps, ${changedRefs} dependency entries ${options.dryRun ? "would be updated" : "updated"} across ${changedProjects} project(s).`,
    )
}

main()
