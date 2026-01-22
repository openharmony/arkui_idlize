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

import { createReferenceType, IDLType, isInterface, isPrimitiveType, isReferenceType, linearizeNamespaceMembers, printType } from "@idlizer/core/idl"
import { forEachSeed, IDLFileLibrary, idlizer, logger, onlyFor, Seed, terminate } from "@idlizer/kit"
import { D, E, processNPrintTS, S, T } from "@idlizer/ost"

class DemoGenerationSeed extends Seed {
  constructor(
    public type: IDLType
  ) {
    super()
  }
  hash(): string {
    return 'HASH' + printType(this.type)
  }
}

idlizer({ name: 'demogen', version: '0.0.0', dryRun: true }, async $ => {

  logger.info("Loading")
  const files = await $.readFiles(['./declarations'])
  const library = new IDLFileLibrary(files)

  logger.info("Generating")
  const generated = forEachSeed(
    {
      context: library,
      begin: linearizeNamespaceMembers(library.files.flatMap(f => f.entries))
        .filter(e => isInterface(e))
        .map(e => new DemoGenerationSeed(createReferenceType(e))),
    },
    onlyFor(DemoGenerationSeed, (seed, ctx) => {
      if (isPrimitiveType(seed.type)) {
        return { continuation: T.c(seed.type.name), declarations: [] }
      }
      if (isReferenceType(seed.type)) {
        const decl = ctx.library.toDeclaration(seed.type)
        if (isInterface(decl)) {
          return {
            continuation: T.c(decl.name),
            declarations: [
              D.struct(decl.name,
                decl.properties.map(prop => ({
                  name: prop.name,
                  type: ctx.expectType(new DemoGenerationSeed(prop.type))
                }))
              )
            ]
          }
        }
      }
      terminate("NOT SUPPORTED")
    })
  )

  logger.info("Installing")
  await $.install(() => {
    let content = ''
    generated.forEach(decl => {
      content += processNPrintTS(decl, '', new Set())
      content += '\n'
    })

    return [{
      filePath: 'test',
      content,
    }]
  })

  logger.info("Done")
})
