
export interface ExternalModuleDataInterface {
	count: number
}

export interface ExternalType {
	nativePointer: bigint
}

export interface ImportedHookValue {
	count: number
}

export interface ExternalClass {
	ptr: bigint
	externalMethod(value: number): boolean
}

export namespace hookns {
	export interface NSExternalType {
		nsNativePointer: number
	}

	export namespace subhookns {
		export interface SubNSExternalType {
			subnsNativePointer: number
		}
	}
}
