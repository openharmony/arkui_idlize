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

import { throwError } from "./utils"

export interface ResultStatusValueFull<T> {
    empty: false
    value: T
}
export interface ResultStatusValueEmpty {
    empty: true
}

export type ResultStatusValue<T> =
      ResultStatusValueFull<T>
    | ResultStatusValueEmpty

export class ResultStatus<T> {
    constructor(
        private value: ResultStatusValue<T>
    ) {}

    isEmpty() {
        return this.value.empty
    }
    get() {
        return this.value.empty
            ? throwError("Empty")
            : this.value.value
    }
    eject() {
        return this.value
    }

    static ok<T>(x:T) {
        return new ResultStatus<T>({ empty: false, value: x })
    }
    static fail<T>() {
        return new ResultStatus<T>({ empty: true })
    }
}

export class Result<T, C = unknown> {

    constructor(
        private value: ResultStatusValue<T>,
        private context: C
    ) {}

    private cloneError<U>(): Result<U, C> {
        return new Result<U, C>({ empty: true }, this.context)
    }

    andThen<U, K>(op:(x:T, c:C) => ResultStatus<U> | Result<U, K>): Result<U, C> {
        if (this.value.empty) {
            return this.cloneError()
        }
        const r = op(this.value.value, this.context)
        return new Result(r instanceof Result ? r.value : r.eject(), this.context)
    }

    static over<C>(ctx:C) {
        return {
            with: <R>(gen:(c:C) => ResultStatus<R>): Result<R, C>  => {
                return new Result<R, C>(gen(ctx).eject(), ctx)
            }
        }
    }
}
