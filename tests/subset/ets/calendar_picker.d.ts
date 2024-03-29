
declare enum CalendarAlign {
    START = 0,
    CENTER = 1,
    END = 2
}

declare class CalendarPickerAttribute extends CommonMethod<CalendarPickerAttribute> {

    edgeAlign(alignType: CalendarAlign, offset?: Offset): CalendarPickerAttribute;
}
