declare enum NavigationTitleMode {
    Free = 0,
    Full,
    Mini,
}

declare interface NavigationInterface { 
    (): NavigationAttribute
}

declare class NavigationAttribute extends CommonMethod<NavigationAttribute> {

    // backButtonIcon(value: string | PixelMap | Resource): NavigationAttribute;
    // backButtonIcon(value: string | PixelMap ): NavigationAttribute;

    // TBD: Fix TestGeneratorVisitor to not generate undefined values
    // navBarWidthRange(value: [Dimension, Dimension]): NavigationAttribute;

    // testTuple(value: [boolean, number]): NavigationAttribute;
    // titleMode(value: NavigationTitleMode): NavigationAttribute;

    // testTuple(value: [boolean, number]): NavigationAttribute;
    // testArray1(value: Array<boolean>): NavigationAttribute;
    // testArray2(value: Array<number>): NavigationAttribute;
    // testBoolean(value: boolean): NavigationAttribute;
    // testNumber(value: number): NavigationAttribute;

  onTitleModeChange(callback: (titleMode: NavigationTitleMode) => void): NavigationAttribute;
}

declare const Navigation: NavigationInterface

declare interface NavPathStack { 
    (): NavigationAttribute
}

declare enum NavigationMode {
    Stack,
    Split,
    Auto,
  }