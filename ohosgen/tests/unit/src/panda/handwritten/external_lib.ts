export interface ExternalModuleDataInterface {
	count: number
}

export interface ExternalType {
	nativePointer: long
}

export interface ImportedHookValue {
	count: number
}

export interface ExternalClass {
	ptr: long
	externalMethod(value: number): boolean
}

export namespace hookns {
	export interface NSExternalType {
		nsNativePointer: long
	}

	export namespace subhookns {
		export interface SubNSExternalType {
			subnsNativePointer: long
		}
	}
}
