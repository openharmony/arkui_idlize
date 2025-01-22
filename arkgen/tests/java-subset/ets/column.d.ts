declare enum HorizontalAlign {
    Start,
    Center,
    End,
}

declare interface ColumnInterface { 
    (): ColumnAttribute
}

declare class ColumnAttribute extends CommonMethod<ColumnAttribute> {

    alignItems(value: HorizontalAlign): ColumnAttribute;
}

declare const Column: ColumnInterface