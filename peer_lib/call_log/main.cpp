
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
#include "arkoala_api_generated.h"
#include <array>

const GENERATED_ArkUINodeModifiers* GetNodeModifiers() {
    // TODO: restore the proper call
    // return GetFullImpl()->getNodeModifiers();
    extern const GENERATED_ArkUINodeModifiers* GENERATED_GetArkUINodeModifiers();
    return GENERATED_GetArkUINodeModifiers();
}

int main(int argc, const char** argv) {
  const Ark_Length var15_0 = {1, 42.000000, 3, 0};
  GetNodeModifiers()->getCommonMethodModifier()->setWidth((Ark_NativePointer)0x123, &var15_0);
  const Ark_Length var16_0 = {2, 0.000000, 1, 43};
  GetNodeModifiers()->getCommonMethodModifier()->setHeight((Ark_NativePointer)0x123, &var16_0);
  const Ark_Boolean var20_0 = false;
  const Ark_Function var21_0 = {42};
  const Opt_SheetOptions var22_0 = {ARK_TAG_OBJECT, {{ARK_TAG_UNDEFINED, 0}, {ARK_TAG_OBJECT, {0, .value0={{1, .value1={.kind="NativeErrorResource", .id=0}}, {ARK_TAG_UNDEFINED, 0}}}}, {ARK_TAG_UNDEFINED, 0}}};
  GetNodeModifiers()->getCommonMethodModifier()->setBindSheet((Ark_NativePointer)0x123, var20_0, &var21_0, &var22_0);
  const Ark_Int32 var2_0 = 1;
  GetNodeModifiers()->getButtonModifier()->setType((Ark_NativePointer)0x123, var2_0);
  const LabelStyle var3_0 = {{ARK_TAG_OBJECT, {102, .i32=3}}};
  GetNodeModifiers()->getButtonModifier()->setLabelStyle((Ark_NativePointer)0x123, &var3_0);
  const LabelStyle var3_1 = {{ARK_TAG_UNDEFINED, 0}};
  GetNodeModifiers()->getButtonModifier()->setLabelStyle((Ark_NativePointer)0x123, &var3_1);
  const Ark_Int32 var4_0 = 2;
  const Opt_Offset var5_0 = {ARK_TAG_OBJECT, {{1, 5.000000, 1, 0}, {1, 6.000000, 1, 0}}};
  GetNodeModifiers()->getCalendarPickerModifier()->setEdgeAlign((Ark_NativePointer)0x123, var4_0, &var5_0);
  const Ark_Int32 var4_1 = 2;
  const Opt_Offset var5_1 = {ARK_TAG_UNDEFINED, 0};
  GetNodeModifiers()->getCalendarPickerModifier()->setEdgeAlign((Ark_NativePointer)0x123, var4_1, &var5_1);
  const Type_FormComponentAttribute_size_Arg0 var31_0 = {{102, .i32=5}, {102, .i32=6}};
  GetNodeModifiers()->getFormComponentModifier()->setSize((Ark_NativePointer)0x123, &var31_0);
  const Type_FormComponentAttribute_size_Arg0 var31_1 = {{103, .f32=5.50}, {103, .f32=6.78}};
  GetNodeModifiers()->getFormComponentModifier()->setSize((Ark_NativePointer)0x123, &var31_1);
  const Type_FormComponentAttribute_size_Arg0 var31_2 = {{102, .i32=0}, {102, .i32=0}};
  GetNodeModifiers()->getFormComponentModifier()->setSize((Ark_NativePointer)0x123, &var31_2);
  const Ark_Int32 var23_0 = 0;
  const Opt_BackgroundBlurStyleOptions var24_0 = {ARK_TAG_OBJECT, {{ARK_TAG_OBJECT, 0}, {ARK_TAG_OBJECT, 0}, {ARK_TAG_OBJECT, {102, .i32=1}}, {ARK_TAG_OBJECT, {{{102, .i32=1}, {102, .i32=1}}}}}};
  GetNodeModifiers()->getCommonMethodModifier()->setBackgroundBlurStyle((Ark_NativePointer)0x123, var23_0, &var24_0);
  const DragPreviewOptions var25_0 = {{ARK_TAG_OBJECT, {1, .value1={102, .i32=10}}}};
  const Opt_DragInteractionOptions var26_0 = {ARK_TAG_OBJECT, {{ARK_TAG_OBJECT, true}, {ARK_TAG_UNDEFINED, 0}}};
  GetNodeModifiers()->getCommonMethodModifier()->setDragPreviewOptions((Ark_NativePointer)0x123, &var25_0, &var26_0);
  const DragPreviewOptions var25_1 = {{ARK_TAG_OBJECT, {0, .value0=true}}};
  const Opt_DragInteractionOptions var26_1 = {ARK_TAG_OBJECT, {{ARK_TAG_UNDEFINED, 0}, {ARK_TAG_OBJECT, false}}};
  GetNodeModifiers()->getCommonMethodModifier()->setDragPreviewOptions((Ark_NativePointer)0x123, &var25_1, &var26_1);
  const Ark_Number var37_0 = {102, .i32=11};
  GetNodeModifiers()->getSideBarContainerModifier()->setMinSideBarWidth_number((Ark_NativePointer)0x123, &var37_0);
  const Ark_String var38_0 = {"42%", 3};
  GetNodeModifiers()->getSideBarContainerModifier()->setMinSideBarWidth_string((Ark_NativePointer)0x123, &var38_0);
  const Type_NavigationAttribute_backButtonIcon_Arg0 var34_0 = {0, .value0={"attr", 4}};
  GetNodeModifiers()->getNavigationModifier()->setBackButtonIcon((Ark_NativePointer)0x123, &var34_0);

  return 0;
}