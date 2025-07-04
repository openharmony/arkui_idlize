
export interface ExternalType {
	nativePointer: bigint
}

export interface ImportedHookValue {
	count: number
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
