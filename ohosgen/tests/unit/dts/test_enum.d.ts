declare enum OrdinaryEnum {
	E1,
	E2,
}

declare enum IntEnum {
	E1 = 11,
	E2 = 22,
}

declare enum StringEnum {
	E1 = "e11",
	E2 = "e22",
}

declare function checkOrdinaryEnums(value1: OrdinaryEnum, value2: OrdinaryEnum): OrdinaryEnum
