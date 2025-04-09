export interface DataInterface {
	propBoolean: boolean;
	propNumber: number;
	propString: string;
	propObject: [boolean, number, string]
}

export class DataClass implements DataInterface {
	propBoolean: boolean;
	propNumber: number;
	propString: string;
	propObject: [boolean, number, string]
}

export function testDataInterface(arg: DataInterface): DataInterface;
export function testDataClass(arg: DataClass): DataClass;
