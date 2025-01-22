import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'
import { execSync } from "child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const IDLIZE_HOME = path.resolve(path.join(__dirname, ".."))
export const IDLIZE_ARKGEN = path.join(IDLIZE_HOME, "arkgen")
export const IDLIZE_CORE = path.join(IDLIZE_HOME, "core")
export const IDLIZE_LINTER = path.join(IDLIZE_HOME, "linter")

export class Package {
    constructor(path) {
        this.path = path
    }

    publish() {
        process.chdir(this.path)
        publishToOpenlab("next")
    }
}

export const packages = [
    new Package(path.join(IDLIZE_HOME, "arkgen")),
    new Package(path.join(IDLIZE_HOME, "core")),
    new Package(path.join(IDLIZE_HOME, "linter"))
]

export class Version {
    constructor(version) {
        let [major, minor, patch] = version.split(/\./).map(x => +x);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    up() {
        ++this.patch
        return new Version(`${this.major}.${this.minor}.${this.patch}`)
    }

    down() {
        --this.patch
        return new Version(`${this.major}.${this.minor}.${this.patch}`)
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`
    }
}

export class Git {
    checkout(branch) {
        execSync(`git checkout -b ${branch}`)
    }

    push(branch) {
        execSync(`git push ${branch}`)
    }

    branch() {
        return execSync("git rev-parse --abbrev-ref HEAD", { encoding: 'utf8'}).toString().trim()
    }

    checkBranch(branch) {
        const branches = execSync("git branch", { encoding: 'utf8'}).toString().trim()
        return branches.includes(branch)
    }

    deleteBranch(branch) {
        execSync(`git branch -D ${branch}`)
    }

    hash() {
        return execSync("git rev-parse --short HEAD", { encoding: 'utf8'}).toString().trim()
    }

    commit(message) {
        execSync(`git commit -m '${message}'`)
    }

    add(files) {
        execSync(`git add ${files}`)
    }

    restore(files) {
        execSync(`git restore ${files}`)
    }

    clean() {
        execSync("git clean -fd")
    }

}

export function writeToPackageJson(filePath, key, value, updater) {
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    json[key] = value
    if (updater) updater(json)
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8")

}

export function replaceInJson(filePath, regexp, value) {
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2).replace(regexp, value), "utf-8")

}


const keyIdlizeRegistry = "@idlize:registry"
const keyKoalaRegistry = "@koalaui:registry"
const koalaRegistry = "https://rnd-gitlab-msc.huawei.com/api/v4/projects/3921/packages/npm/"
const idlizeRegistry = "https://nexus.bz-openlab.ru:10443/repository/koala-npm/"

function setRegistry(key, value) {
    execSync(`npm config --location project set ${key} ${value}`)
}

function getRegistry(key) {
    execSync(`npm config --location project get ${key}`)
}

export function publishToOpenlab(tag, dryRun = false) {
    //setRegistry(keyIdlizeRegistry, idlizeRegistry)
    //setRegistry(keyIdlizeRegistry2, idlizeRegistry)
    //setRegistry("strict-ssl", false)

    if (dryRun) {
        execSync(`npm publish --dry-run --tag ${tag}`)
    } else {
        execSync(`npm publish --tag ${tag}`)
    }
}

export function publishToGitlab(tag, dryRun = false) {
    setRegistry(keyIdlizeRegistry, koalaRegistry)
    setRegistry("strict-ssl", false)

    if (dryRun) {
        execSync(`npm publish --dry-run --tag ${tag}`)
    } else {
        execSync(`npm publish --tag ${tag}`)
    }
    setRegistry(keyIdlizeRegistry, idlizeRegistry)
}