import fs from 'fs';
import path from 'path'
import { program } from 'commander';
import { execSync } from 'child_process';
import { exit } from 'process';

function errorAndExit(error) {
    console.error(error)
    exit(1)
}

function main() {
    const options = program
        .option(`--input-dir <path>`, 'directory with produced output, that must be compared with golden')
        .option(`--golden-dir <path>`, 'directory describing expected output')
        .option(`--gen`, 'replace goldens with input', false)
        .parse()
        .opts()

    const inputDir = path.resolve(process.cwd(), options.inputDir)
    const goldenDir = path.resolve(process.cwd(), options.goldenDir)
    if (!inputDir || !fs.existsSync(inputDir))
        errorAndExit(`input-dir ${inputDir} does not exists`)
    if (!goldenDir || !fs.existsSync(goldenDir))
        errorAndExit(`golden-dir ${goldenDir} does not exists`)
    try {
        execSync(`diff --recursive ${goldenDir} ${inputDir}`)
    } catch (e) {
        if (options.gen) {
            fs.rmSync(goldenDir, { recursive: true })
            fs.mkdirSync(goldenDir, { recursive: true })
            fs.cpSync(inputDir, goldenDir, { recursive: true })
            console.log(e.stdout.toString())
        } else {
            errorAndExit(e.stdout.toString())
        }
    }
}

main()