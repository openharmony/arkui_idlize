// patch to original @ohos.xml

export interface Point {
    x: number;
    y: number;
}
export namespace xml {
    export function returnPromise(): Promise<number>

    export function getPoint(): Point

    export class MapTest {
        testSerialize(options: Record<string, number>): number
    }
}