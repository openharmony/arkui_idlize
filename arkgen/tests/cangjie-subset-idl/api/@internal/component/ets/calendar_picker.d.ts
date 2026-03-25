/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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


declare enum CalendarAlign {
    START = 0,
    CENTER = 1,
    END = 2
}

declare interface CalendarOptions {

  hintRadius?: number | Resource;
  selected?: Date;
  start?: Date;
  end?: Date;
  disabledDateRange?: DateRange[];
}

declare interface CalendarPickerInterface {
    (options?: CalendarOptions): CalendarPickerAttribute
}

declare class CalendarPickerAttribute extends CommonMethod<CalendarPickerAttribute> {
    edgeAlign(alignType: CalendarAlign, offset?: Offset): CalendarPickerAttribute;
    edgeAlign(alignType: Optional<CalendarAlign>, offset?: Offset): CalendarPickerAttribute;

    altEdgeAlign(alignType: CalendarAlign, offset?: AltOffset): CalendarPickerAttribute;
}

declare const CalendarPicker: CalendarPickerInterface

declare const CalendarPickerInstance: CalendarPickerAttribute;
