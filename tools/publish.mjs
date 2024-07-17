import fs from "fs"
import chalk from "chalk"
import path from "path"
import process from "process"
import { execSync } from "child_process"

const CWD = process.cwd()
const prebuiltPath = path.join(CWD, ".packages")

const keyIdlizeRegistry = "@azanat:registry"
const keyKoalaRegistry = "@koalaui:registry"
const koalaRegistry = "https://rnd-gitlab-msc.huawei.com/api/v4/projects/3921/packages/npm/"
const idlizeRegistry = "https://nexus.bz-openlab.ru:10443/repository/koala-npm/"

function setRegistry(key, value) {
    execSync(`npm config set ${key} ${value}`)
}

function getRegistry(key) {
    execSync(`npm config get ${key}`)
}

function pack() {
    if (fs.existsSync(prebuiltPath))
        fs.rmSync(prebuiltPath, { recursive: true })
    fs.mkdirSync(prebuiltPath)
    execSync(`npm pack --pack-destination ${prebuiltPath}`)
}

function publishToOpenlab() {

    pack()
    setRegistry(keyIdlizeRegistry, idlizeRegistry)

    let packageName = fs.readdirSync(prebuiltPath)[0]
    console.log(chalk.green(`> Publishing ${packageName}...`))
    execSync(`npm publish ${path.join(prebuiltPath, packageName)}`)

}

function publishToGitlab() {

    pack()
    setRegistry(keyIdlizeRegistry, koalaRegistry)

    let packageName = fs.readdirSync(prebuiltPath)[0]
    console.log(chalk.green(`> Publishing ${packageName}...`))
    execSync(`npm publish ${path.join(prebuiltPath, packageName)}`)

    setRegistry(keyIdlizeRegistry, idlizeRegistry)
}

function publish() {
    process.env.KOALA_BZ == true ? publishToOpenlab() : publishToGitlab()
}

publish()
