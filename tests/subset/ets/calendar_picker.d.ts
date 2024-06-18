
declare enum CalendarAlign {
    START = 0,
    CENTER = 1,
    END = 2
}

declare interface CalendarPickerInterface { 
    (): CalendarPickerAttribute
}

declare class CalendarPickerAttribute extends CommonMethod<CalendarPickerAttribute> {
    edgeAlign(alignType: CalendarAlign, offset?: Offset): CalendarPickerAttribute;

    altEdgeAlign(alignType: CalendarAlign, offset?: AltOffset): CalendarPickerAttribute;
}

declare const CalendarPicker: CalendarPickerInterface