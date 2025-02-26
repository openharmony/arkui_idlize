export namespace xml {
    export function returnPromise(): Promise<number>

    export interface Point {
        x: number;
        y: number;
    }

    export function getPoint(): Point

    export class MapTest {
        testSerialize(options: Record<string, number>): number
    }
}