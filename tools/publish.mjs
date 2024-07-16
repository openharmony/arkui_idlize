import fs from "fs"
import chalk from "chalk"
import path from "path"
import process from "process"
import { execSync } from "child_process"

const CWD = process.cwd()
const prebuiltPath = path.join(CWD, ".packages")

function pack() {
    if (fs.existsSync(prebuiltPath))
        fs.rmSync(prebuiltPath, { recursive: true })
    fs.mkdirSync(prebuiltPath)
    execSync(`npm pack --pack-destination ${ prebuiltPath }`)
}

function publish() {
    pack()

    let packageName = fs.readdirSync(prebuiltPath)[0]

    console.log(chalk.green(`> Publishing ${ packageName }...`))
    execSync(`npm publish ${ path.join(prebuiltPath, packageName) } --registry https://nexus.bz-openlab.ru:10443/repository/koala-npm/${packageName}`)
}


publish()