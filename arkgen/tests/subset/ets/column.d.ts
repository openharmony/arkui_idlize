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

declare enum LayoutSafeAreaType {
    SYSTEM = 0,
}

declare enum LayoutSafeAreaEdge {
    TOP = 0,
    BOTTOM = 1,
}

declare enum TitleHeight {
    MainOnly,
    MainWithSub,
}
