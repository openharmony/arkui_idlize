
export interface ExternalType {
	nativePointer: long
}

export interface ImportedHookValue {
	count: number
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
