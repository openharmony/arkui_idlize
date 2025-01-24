
        export class TypeChecker {
            static typeInstanceOf<T>(value: Object, prop: string): boolean {
                return value.hasOwnProperty(prop)
            }
            static typeCast<T>(value: Object): T {
                return value as unknown as T
            }
        }
    