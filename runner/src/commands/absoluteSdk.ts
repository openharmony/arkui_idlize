import * as fs from "fs"
import * as path from "path"

export interface AbsoluteSdkConfig {
    preparedSdk12: string,
    absolutePreparedSdk12: string
}

export function absoluteSdk({
    preparedSdk12,
    absolutePreparedSdk12,
}: AbsoluteSdkConfig): void {
    preparedSdk12 = path.resolve(preparedSdk12)
    absolutePreparedSdk12 = path.resolve(absolutePreparedSdk12)

    fs.mkdirSync(absolutePreparedSdk12, { recursive: true })
    fs.cpSync(path.join(preparedSdk12, "api"), path.join(absolutePreparedSdk12, "api"), { recursive: true })
    fs.rmSync(path.join(absolutePreparedSdk12, "api", "@internal"), { recursive: true })

    const arktsconfig = {
        "compilerOptions": {
            "package": "api",
            "baseUrl": "./api",
            "outDir": "./build",
            "paths": {} as any
        },
        "include": ["./api/**/*.ets"]
    }
    const apiPath = path.join(absolutePreparedSdk12, "api")
    for (const file of fs.readdirSync(apiPath, { recursive: true, encoding: 'utf-8' })) {
        if (!fs.statSync(path.join(apiPath, file)).isFile() || !file.endsWith('.d.ets')) {
            continue
        }
        const content = fs.readFileSync(path.join(apiPath, file), { encoding: 'utf-8' }).replaceAll(/^(import|export) .* from ['"](.*)['"];?$/gm, (all: string, _: string, from: string): string => {
            if (!from.startsWith('.'))
                return all
            const fromAbsolute = path.join(apiPath, file, '..', from)
            const fromRelatire = path.relative(apiPath, fromAbsolute)
            return all.replace(from, pathToPackage(fromRelatire))
        })
        const fileNoExt = file.substring(0, file.length - ".d.ets".length)
        arktsconfig["compilerOptions"]["paths"][pathToPackage(fileNoExt)] = [path.join(apiPath, file).substring(0, path.join(apiPath, file).length-".d.ets".length)]
        fs.writeFileSync(path.join(apiPath, file), content, { encoding: 'utf-8' })
    }
    fs.writeFileSync(path.join(absolutePreparedSdk12, "arktsconfig.json"), JSON.stringify(arktsconfig, undefined, 4), { encoding: 'utf-8' })
}

function pathToPackage(s: string): string {
    if (path.basename(s).startsWith("@"))
        return path.basename(s)
    return s.replaceAll("/", ".")
}