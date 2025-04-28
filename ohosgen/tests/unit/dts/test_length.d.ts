
export interface Resource {
    id: number;
    type?: number;
}

export type Length = string | number | Resource;

export function testLength(step: number, value: Length): boolean
