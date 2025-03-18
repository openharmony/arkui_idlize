declare enum OrdinaryEnum {
	E1,
	E2,
}

declare enum IntEnum {
	E1 = 11,
	E3 = 33,
	E5 = 55,
}

declare enum StringEnum {
	E1 = "e11",
	E2 = "e22",
}

declare function checkOrdinaryEnums(value1: OrdinaryEnum, value2: OrdinaryEnum): OrdinaryEnum
declare function checkIntEnums(value1: IntEnum, value2: IntEnum): IntEnum
declare function checkStringEnums(value1: StringEnum, value2: StringEnum): StringEnum
