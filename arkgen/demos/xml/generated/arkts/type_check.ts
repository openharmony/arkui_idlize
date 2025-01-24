
        export class TypeChecker {
            static typeInstanceOf<T>(value: Object, prop: string): boolean {
                return value instanceof T
            }
            static typeCast<T>(value: Object): T {
                return value as T
            }
        }
    