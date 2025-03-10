declare interface DataInterface {
	propBoolean: boolean;
	propNumber: number;
	propString: string;
	propObject: [boolean, number, string]
}

declare class DataClass implements DataInterface {
	propBoolean: boolean;
	propNumber: number;
	propString: string;
	propObject: [boolean, number, string]
}

declare function testDataInterface(arg: DataInterface): DataInterface;
declare function testDataClass(arg: DataClass): DataClass;
