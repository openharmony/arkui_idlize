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

export class EnumEntity {
    constructor(
        public readonly name: string,
        public readonly comment: string,
        public readonly members: EnumMember[] = [],
    ) {}
    pushMember(name: string, comment: string, initializerText: string | undefined) {
        this.members.push(new EnumMember(name, comment, initializerText))
    }
}

export class EnumMember {
    constructor(
        public readonly name: string,
        public readonly comment: string,
        public readonly initializerText: string | undefined,
    ) {}
}
