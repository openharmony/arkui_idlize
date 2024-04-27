import { ArkStructCommon } from './ArkCommon'

export abstract class ArkCommonStruct0<T extends ArkCommonStruct0<T>> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct0<S>>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(): void { throw new Error("not implemented") }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void)
    ): void { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void)
    ): void
}

export abstract class ArkCommonStruct1<T, A1> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct1<S, A1>, A1>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1): void { }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1
    ): void

    /** @memo */
    protected _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1
    ) { throw new Error("not implemented") }
}

export abstract class ArkStructBase<T> extends ArkCommonStruct1<T, Partial<T>>{
    // Can be overridden as an effect of @Prop, @Watch etc
    /** @memo */
    protected __updateStruct(arg1?: Partial<T>): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        initializers?: Partial<T>
    ) { throw new Error("not implemented") }
}

export abstract class ArkCommonStruct2<T, A1, A2> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct2<S, A1, A2>, A1, A2>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1, arg2?: A2): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1, arg2?: A2
    ): void
}

export abstract class ArkCommonStruct3<T, A1, A2, A3> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct3<S, A1, A2, A3>, A1, A2, A3>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2, arg3?: A3
    ): S {
        throw new Error("not implemented") 
    }
    protected __initializeStruct(arg1?: A1, arg2?: A2, arg3?: A3): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2, arg3?: A3
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg?: A1, arg2?: A2, arg3?: A3
    ): void
}

export abstract class ArkCommonStruct4<T, A1, A2, A3, A4> extends ArkStructCommon {
    /** @memo */
    static _instantiate<S extends ArkCommonStruct4<S, A1, A2, A3, A4>, A1, A2, A3, A4>(
        /** @memo */
        attributes: undefined | ((instance: S) => void),
        factory: () => S,
        arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ): S { throw new Error("not implemented") }
    protected __initializeStruct(arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4): void { }

    /** @memo */
    _buildWrapper(
        /** @memo */
        attributes: undefined | ((instance: T) => void),
        arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ) { throw new Error("not implemented") }

    /** @memo */
    abstract _build(
        /** @memo */
        attributes: undefined | ((instance: T) => void), arg?: A1, arg2?: A2, arg3?: A3, arg4?: A4
    ): void
}