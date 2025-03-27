
declare class CheckExceptionInterface {

	/**
	 * @throws { Error }
	 */
	checkException()
}

declare class CheckExceptionClass {

	/**
	 * @throws { Error }
	 */
	checkException()

	/**
	 * @throws { Error }
	 */
	getInterface(): CheckExceptionInterface
}
