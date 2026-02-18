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

package handwritten.extractors

import koalaui.arkoala.SampleTransformSrcI
import koalaui.arkoala.SampleTransformDstI

class SampleTransformDstIImpl(public override var length: Double) : SampleTransformDstI {
}

fun transform_Ark_SampleTransformSrcI_to_Ark_SampleTransformDstI(value: SampleTransformSrcI): SampleTransformDstI {
    return SampleTransformDstIImpl(value.text.length.toDouble())
}
