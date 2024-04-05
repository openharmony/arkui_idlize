declare enum HorizontalAlign {
    Start,
    Center,
    End,
}

declare class ColumnAttribute extends CommonMethod<ColumnAttribute> {

    alignItems(value: HorizontalAlign): ColumnAttribute;
}