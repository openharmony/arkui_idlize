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
import { join, resolve } from "node:path";
import { getIO } from "../../../cli/application";

const TEMPLATE_PATH = resolve(__dirname, '..', '..', 'resources')
const io = getIO()

export async function installTemplate(name:string, destination:string, variables:Map<string, string>) {
    let template = await io.readFile(join(TEMPLATE_PATH, name))
    variables.forEach((val, key) => {
        template = template.replaceAll(`%${key}%`, val)
    })
    await io.writeFile(destination, template)
}


