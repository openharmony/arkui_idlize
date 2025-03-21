declare enum OrdinaryEnum {
	E1,
	E2,
	E3,
}

declare enum IntEnum {
	E1 = 11,
	E3 = 33,
	E5 = 55,
}

declare enum DuplicateIntEnum {
	FIRST = 0,
	first = 0,
	SECOND = 1,
	second = 1,
	THIRD = 2,
	third = 2,
}

declare enum StringEnum {
	E1 = "e11",
	E2 = "e22",
	E3 = "e33",
}


declare function checkOrdinaryEnums(value1: OrdinaryEnum, value2: OrdinaryEnum): OrdinaryEnum
declare function checkIntEnums(value1: IntEnum, value2: IntEnum): IntEnum
declare function checkDuplicateIntEnums(value1: DuplicateIntEnum, value2: DuplicateIntEnum): DuplicateIntEnum
declare function checkStringEnums(value1: StringEnum, value2: StringEnum): StringEnum
