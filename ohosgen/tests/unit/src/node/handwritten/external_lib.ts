
import { KPointer } from "@koalaui/interop"

export interface ExternalModuleDataInterface {
	count: number
}

export interface ExternalType {
	nativePointer: KPointer
}

export interface ImportedHookValue {
	count: number
}

export interface ExternalClass {
	ptr: KPointer
	externalMethod(value: number): boolean
}

export namespace hookns {
	export interface NSExternalType {
		nsNativePointer: KPointer
	}

	export namespace subhookns {
		export interface SubNSExternalType {
			subnsNativePointer: KPointer
		}
	}
}
