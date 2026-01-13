/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

export function getLicense() {
    return `
@license
Copyright (c) ${new Date().getUTCFullYear()} Huawei Device Co., Ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`.trimStart()
}

export function getLogo() {
    return `                  PRODUCED BY
  ___________________________
 |   _____   ____     _      |
 |  |_   _| |  _ \\   | |     |
 |    | |   | | \\ \\  | |     |
 |    | |   | |  | | | |     |
 |    | |   | |  | | | |     |
 |   _| |_  | |__| | | |__   |
 |  |_____| |______| |____|  |
 |                           |
 |    I     Z     E     R    |
 |___________________________|

 Generator ............. skgen
 Version ............... 0.0.1
 Commit .................. N/A
`
}

export function generatedWarning() {
    return `
WARNING! THIS FILE IS AUTO-GENERATED. DO NOT MAKE CHANGES.
THEY WILL BE LOST ON NEXT GENERATION!
`
}

export function concatVertical(leftText:string, rightText:string, sep:string) {
    const leftLines = leftText.split('\n')
    const rightLines = rightText.split('\n')

    const leftMax = leftLines.reduce((a, x) => Math.max(a, x.length), -1)
    let result = ''
    for (let i = 0; i < Math.max(leftLines.length, rightLines.length); ++i) {
        const leftLine = leftLines.at(i) ?? ''
        const rightLine = rightLines.at(i) ?? ''
        const content = leftLine.padEnd(leftMax, ' ') + sep + rightLine
        result += content.trimEnd() + '\n'
    }
    return result
}

export function concatHorizontal(topText:string, bottomText:string) {
    return topText + bottomText
}

export function makeComment(text:string) {
    const lines = text.split('\n')
    let result = '/**\n'
    lines.forEach((line, idx) => {
        let prefix = ' * '
        if (idx === lines.length - 1) {
            prefix = ' */'
        }
        const content = prefix + line
        result += content.trimEnd() + '\n'
    })
    return result
}

export function getClaim() {
    return makeComment(
        concatVertical(
            getLogo(),
            concatHorizontal(
                getLicense(),
                generatedWarning()
            ),
            ' | '
        )
    )
}