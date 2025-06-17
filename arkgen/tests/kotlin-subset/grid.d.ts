// declare interface GridLayoutOptions {
//     regularSize: [number, number];
//     irregularIndexes?: number[];
//     onGetIrregularSizeByIndex?: (index: number) => [number, number]
//     onGetRectByIndex?: (index: number) => [number, number, number, number]
// }

interface GridInterface {
    // (scroller?: Scroller, layoutOptions?: GridLayoutOptions): GridAttribute;
    (): GridAttribute;
}

declare class GridAttribute extends ScrollableCommonMethod<GridAttribute> {
    columnsTemplate(value: string): GridAttribute;
    rowsTemplate(value: string): GridAttribute;
    onScrollIndex(event: (first: number, last: number) => void): GridAttribute;
}

declare const Grid: GridInterface;
declare const GridInstance: GridAttribute;