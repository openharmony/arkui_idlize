/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { withCWD } from "../utils"
import { SCRAPER_CWD } from "../shared"
import { runScraper } from "../tools/scraper"
import { resolve } from "path"

interface ScrapeOptions {
    idlDirectory: string
    configPath:string
}

export function scrape(options:ScrapeOptions) {
    const filesPath = resolve(options.idlDirectory)
    const configPath = resolve(options.configPath)
    return withCWD(SCRAPER_CWD, () => {
        return runScraper(filesPath, configPath)
    })
}
