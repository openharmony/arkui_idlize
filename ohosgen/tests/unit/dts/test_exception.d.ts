
export class CheckExceptionInterface {

	/**
	 * @throws { Error }
	 */
	checkException()
}

export class CheckExceptionClass {

	/**
	 * @throws { Error }
	 */
	// declaring the method without void return value
	// leads to SIGSEGV in ArkTS
	// checkException()
	checkException(): void

	/**
	 * @throws { Error }
	 */
	getInterface(): CheckExceptionInterface
}
