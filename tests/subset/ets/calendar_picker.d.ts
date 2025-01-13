
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
