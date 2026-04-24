#!/usr/bin/env node

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

import { logger, forEachSeed, onlyFor, idlizer } from "@idlizer/kit"
import { buildSelectors, GeneratorSeed, roll } from "./generator"
import { GeneratorLibrary } from "./library"
import { print } from "./install"
import { CONFIG_SEARCH_PATHS, ProjectConfigSchema, resolveConfigPaths } from "./config"
import { join } from "node:path"
import { doInputDiagnostics } from "./diagnostics"

idlizer({ name: 'skgen', version: '0.3.0' }, async $ => {

    logger.info("Loading")
    const { data: userConfig, path: configPath } = await $.readConfig(ProjectConfigSchema, CONFIG_SEARCH_PATHS.map(p => join(process.cwd(), p)))
    const config = resolveConfigPaths(userConfig, configPath)
    const files = await $.readFiles(config.declarations.source)
    const library = new GeneratorLibrary(files, config)
    $.diagnostics(() => doInputDiagnostics(library))

    logger.info("Generating")
    const generated = forEachSeed(
        {
            context: { library, selector: buildSelectors() },
            begin: library.rootDeclarations().map(ref => new GeneratorSeed(ref)),
        },
        onlyFor(GeneratorSeed, roll)
    )

    logger.info("Installing")
    await $.install(() => print(config.generated.output, generated, library.allPackages(['framework'])))
    if (config.generated.outputReport) {
        const report = library.prepareReport()
        await $.io.mkdir(config.generated.outputReport, { recursive: true })
        await $.io.writeFile(join(config.generated.outputReport, 'GENERATED_STATE.md'), report)
    }

    logger.info("Done")
})
