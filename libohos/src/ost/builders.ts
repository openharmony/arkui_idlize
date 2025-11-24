/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { D, DD, E, S, T } from "./builder"
import {
    AccessorExpression, Hint, BinaryExpression, CallExpression, ClassDeclaration,
    ConstructorExpression, DeclarationStatement, ExpressionStatement, FunctionDeclaration,
    IfStatement, LoopStatement, LWExpression, LWKind, LWStatement, LWType, Modifier,
    StructureDeclaration, Annotation, SimpleAnnotation, DecoratorKind, MacroInvocation,
    UnaryExpression, CheckCastExpression, FunctionalType, TypedefDeclaration,
    EnumDeclaration, SwitchStatement
} from "./lws"
import { Hs, Md, std, Ts } from "./stdlib";

type ExpressionLike = string | number | LWExpression

const id = <T>(it: T) => it

const morphInto = <T, V, R>(obj: T, prop: string, xform: (value: V) => R) => (value: V) => {
    obj[prop as keyof T] = xform(value) as T[keyof T]
    return obj
}
const saveInto = <T, V>(obj: T, prop: string) => morphInto<T, V, V>(obj, prop, id)

function apply<T>(value: ExpressionLike | undefined, f: (expr: LWExpression) => T): T | ExpressionBuilder<T> {
    if (value === undefined)
        return new ExpressionBuilder(f)
    return f(typeof value === 'object' ? value : E.c(value))
}
function assign<T>(obj: T, prop: string, value?: ExpressionLike): T | ExpressionBuilder<T> {
    return apply(value, saveInto(obj, prop))
}
function push<T>(obj: T, prop: string, value?: ExpressionLike): T | ExpressionBuilder<T> {
    return apply(value, expr => {
        (obj[prop as keyof T] as LWExpression[]).push(expr)
        return obj
    })
}

function check(desc: string, ...data: any[]) {
    if (data.includes(undefined))
        throw new Error(desc + ' not fully initialized: ' + data.join(", "))
}

class AccessorBuilder<P> {
    constructor(
        private _cont: (expr: AccessorExpression) => P,
        private _accessor?: string | LWExpression
    ) {}
    private _receiver?: LWExpression
    private _receiverHints: Hint[] = []
    private _hints: Hint[] = []
    ptr() { this._receiverHints.push(Hs.ptrVal()); return this }
    static() { this._hints.push(Hs.staticMethod()); return this }
    excl() { this._hints.push(Hs.excl()); return this }
    member(name: string) { this._accessor = name; return this }
    index(value: ExpressionLike): this
    index(): ExpressionBuilder<this>
    index(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_accessor', value)
    }
    receiver(value: ExpressionLike): this
    receiver(): ExpressionBuilder<this>
    receiver(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_receiver', value)
    }
    $(): P {
        check("Accessor", this._receiver, this._accessor)
        this._receiver!.hints.push(...this._receiverHints)
        return this._cont(E.get(this._receiver!, this._accessor!, this._hints))
    }
}

class UnaryBuilder<P> {
    constructor(private _cont: (expr: UnaryExpression) => P, private op: string) {}
    private _expr?: LWExpression
    value(expr: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(expr?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_expr', expr)
    }
    $(): P {
        check("Unary", this._expr)
        return this._cont(E.unary(this.op, this._expr!))
    }
}

class BinaryBuilder<P> {
    constructor(private _cont: (expr: BinaryExpression) => P, private op: string) {}
    private _lhs?: LWExpression
    private _rhs?: LWExpression
    left(value: ExpressionLike): this
    left(): ExpressionBuilder<this>
    left(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_lhs', value)
    }
    right(value: ExpressionLike): this
    right(): ExpressionBuilder<this>
    right(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_rhs', value)
    }
    $(): P {
        check("Binary", this._lhs, this._rhs)
        return this._cont(E.bin(this.op, this._lhs!, this._rhs!))
    }
}

class CallBuilder<P> {
    constructor(
        private _cont: (expr: CallExpression) => P,
        private _func?: string | LWExpression
    ) {}
    private _receiver?: LWExpression
    private _args: LWExpression[] = []
    receiver(value: ExpressionLike): this
    receiver(): ExpressionBuilder<this>
    receiver(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_receiver', value)
    }
    args(args: LWExpression[]) { this._args.push(...args); return this }
    function(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_func'))
    }
    arg(value: ExpressionLike): this
    arg(): ExpressionBuilder<this>
    arg(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return push(this, '_args', value)
    }
    $(): P {
        check("Call", this._func)
        const callee = this._receiver ? E.get(this._receiver, this._func!)
            : typeof this._func === 'object' ? this._func
            : E.v(this._func!)
        return this._cont(E.call(callee, this._args))
    }
}

class ConstructorBuilder<P> {
    constructor(
        private _cont: (expr: ConstructorExpression) => P,
        private _name?: string
    ) {}
    private _args: LWExpression[] = []
    private _typeArgs: LWType[] = []
    private _hints: Hint[] = []
    asStruct() { this._hints.push(Hs.asStruct()); return this }
    stack() { this._hints.push(Hs.stackInstance()); return this }
    args(args: LWExpression[]) { this._args.push(...args); return this }
    arg(value: ExpressionLike): this
    arg(): ExpressionBuilder<this>
    arg(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return push(this, '_args', value)
    }
    typeArgs(args: LWType[]) { this._typeArgs.push(...args); return this }
    $(): P {
        return this._cont(E.instance(this._name ?? 'CTOR_NAME_MISSING', this._args, this._typeArgs, this._hints))
    }
}

class CheckCastBuilder<P> {
    constructor(
        private _cont: (expr: CheckCastExpression) => P,
        private _op: 'cast' | 'instanceof',
        private _type: LWType
    ) {}
    private _expr?: LWExpression
    private _hints: Hint[] = []
    static() { this._hints.push(Hs.staticMethod()); return this }
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_expr', value)
    }
    $(): P {
        check("Cast", this._expr)
        return this._cont({
            kind: LWKind.CheckCastExpression,
            op: this._op,
            expression: this._expr!,
            type: this._type,
            hints: this._hints
        })
    }
}

class ExpressionBuilder<P> {
    constructor(private _cont: (expr: LWExpression) => P) {}
    private _expr?: LWExpression
    const(value: string | number ): ExpressionBuilder<P> { this._expr = E.c(value); return this }
    var(name: string): ExpressionBuilder<P> { this._expr = E.v(name); return this }
    access(accessor?: string | LWExpression): AccessorBuilder<this> {
        return new AccessorBuilder(saveInto(this, '_expr'), accessor)
    }
    binary(op: string): BinaryBuilder<this> {
        return new BinaryBuilder(saveInto(this, '_expr'), op)
    }
    unary(op: string): UnaryBuilder<this> {
        return new UnaryBuilder(saveInto(this, '_expr'), op)
    }
    call(func?: string | LWExpression): CallBuilder<this> {
        return new CallBuilder(saveInto(this, '_expr'), func)
    }
    ctor(name?: string): ConstructorBuilder<this> {
        return new ConstructorBuilder(saveInto(this, '_expr'), name)
    }
    cast(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_expr'), 'cast', type)
    }
    instanceof(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_expr'), 'instanceof', type)
    }
    $(): P {
        check("Expression", this._expr)
        return this._cont(this._expr!)
    }
    $stmt(): ExpressionStatement {
        check("Expression", this._expr)
        return S.e(this._expr!)
    }
}

class DeclarationBuilder<P> {
    constructor(private _cont: (stmt: DeclarationStatement) => P, private _name: string, private _type?: LWType) {}
    private _mutable: boolean = false
    private _static: boolean = false
    private _value?: LWExpression
    mutable() { this._mutable = true; return this }
    static() { this._static = true; return this }
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_value', value)
    }
    $(): P {
        const type = this._type ?? T.c(std.names.types.auto)
        return this._cont(S.declaration(this._name, type, this._mutable, this._value, this._static))
    }
}

class ReturnBuilder<P> {
    constructor(private _cont: (stmt: LWStatement) => P, private _type?: LWType) {}
    private _value?: LWExpression
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_value', value)
    }
    access(accessor?: string | LWExpression): AccessorBuilder<this> {
        return new AccessorBuilder(saveInto(this, '_value'), accessor)
    }
    binary(op: string): BinaryBuilder<this> {
        return new BinaryBuilder(saveInto(this, '_value'), op)
    }
    unary(op: string): UnaryBuilder<this> {
        return new UnaryBuilder(saveInto(this, '_value'), op)
    }
    call(func?: string | LWExpression): CallBuilder<this> {
        return new CallBuilder(saveInto(this, '_value'), func)
    }
    cast(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_value'), 'cast', type)
    }
    instanceof(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_value'), 'instanceof', type)
    }
    ctor(name?: string): ConstructorBuilder<this> {
        return new ConstructorBuilder(saveInto(this, '_value'), name)
    }
    $(): P {
        if (this._value) {
            // either `return e` or just `e`
            const wrap = this._type === Ts.prim.void ? S.e : S.return
            return this._cont(wrap(this._value!))
        }
        // plain `return`
        return this._cont(S.return())
    }
}

class IfBuilder<P> {
    constructor(private _cont: (stmt: IfStatement) => P) {}
    private _cond?: LWExpression
    private _then?: LWStatement
    private _else?: LWStatement
    condition(cond: LWExpression) { this._cond = cond; return this }
    cond(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_cond'))
    }
    then(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_then'))
    }
    else(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_else'))
    }
    $(): P {
        check("If", this._cond, this._then)
        return this._cont(S.if(this._cond!, this._then!, this._else))
    }
}

class SwitchBuilder<P> {
    constructor(private _cont: (stmt: SwitchStatement) => P) {}
    private _selector?: LWExpression
    private _cases: SwitchStatement['cases'] = []
    private _default: LWStatement[] = []
    cases(cases: SwitchStatement['cases']) { this._cases.push(...cases); return this }
    default(stmts: LWStatement[]) { this._default.push(...stmts); return this }
    selector(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_selector'))
    }
    $(): P { return this._cont({
        kind: LWKind.SwitchStatement,
        selector: this._selector!,
        cases: this._cases,
        default: this._default
    }); }
}

class LoopBuilder<P> {
    constructor(private _cont: (stmt: LoopStatement) => P) {}
    private _init?: LWStatement
    private _cond?: LWExpression
    private _step?: LWStatement
    private _body?: LWStatement
    condition(cond: LWExpression) { this._cond = cond; return this }
    bodyStmt(body: LWStatement) { this._body = body; return this }
    init(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_init'))
    }
    cond(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_cond'))
    }
    step(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_step'))
    }
    body(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_body'))
    }
    $(): P {
        check("Loop", this._cond, this._body)
        return this._cont(S.loop(this._cond!, this._body!, this._init, this._step))
    }
}

class StatementBuilder<P> {
    constructor(private _cont: (stmt: LWStatement) => P) {}
    private _stmt?: LWStatement
    binary(op: string): BinaryBuilder<StatementBuilder<P>> {
        return new BinaryBuilder(morphInto(this, '_stmt', S.e), op)
    }
    unary(op: string): UnaryBuilder<StatementBuilder<P>> {
        return new UnaryBuilder(morphInto(this, '_stmt', S.e), op)
    }
    block(): BlockBuilder<StatementBuilder<P>> {
        return new BlockBuilder(morphInto(this, '_stmt', S.block))
    }
    call(func?: string | LWExpression): CallBuilder<StatementBuilder<P>> {
        return new CallBuilder(morphInto(this, '_stmt', S.e), func)
    }
    decl(name: string, type?: LWType): DeclarationBuilder<StatementBuilder<P>> {
        return new DeclarationBuilder(morphInto(this, '_stmt', id), name, type)
    }
    if(): IfBuilder<StatementBuilder<P>> {
        return new IfBuilder(morphInto(this, '_stmt', id))
    }
    switch(): SwitchBuilder<StatementBuilder<P>> {
        return new SwitchBuilder(morphInto(this, '_stmt', id))
    }
    loop(): LoopBuilder<StatementBuilder<P>> {
        return new LoopBuilder(morphInto(this, '_stmt', id))
    }
    return(type?: LWType): ReturnBuilder<StatementBuilder<P>> {
        return new ReturnBuilder(morphInto(this, '_stmt', id), type)
    }
    $(): P {
        check("Statement", this._stmt)
        return this._cont(this._stmt!)
    }
}

class BlockBuilder<P> {
    constructor(private _cont: (stmts: LWStatement[]) => P) {}
    private _stmts: LWStatement[] = []
    statements(stmts: LWStatement[]) { this._stmts.push(...stmts); return this }
    binary(op: string): BinaryBuilder<BlockBuilder<P>> {
        return new BinaryBuilder(stmt => {
            this._stmts.push(S.e(stmt))
            return this
        }, op)
    }
    unary(op: string): UnaryBuilder<BlockBuilder<P>> {
        return new UnaryBuilder(stmt => {
            this._stmts.push(S.e(stmt))
            return this
        }, op)
    }
    block(): BlockBuilder<BlockBuilder<P>> {
        return new BlockBuilder(stmts => {
            this._stmts.push(S.block(stmts))
            return this
        })
    }
    call(func?: string | LWExpression): CallBuilder<BlockBuilder<P>> {
        return new CallBuilder(stmt => {
            this._stmts.push(S.e(stmt))
            return this
        }, func)
    }
    decl(name: string, type?: LWType): DeclarationBuilder<BlockBuilder<P>> {
        return new DeclarationBuilder(stmt => {
            this._stmts.push(stmt)
            return this
        }, name, type)
    }
    if(): IfBuilder<BlockBuilder<P>> {
        return new IfBuilder(stmt => {
            this._stmts.push(stmt)
            return this
        })
    }
    switch(): SwitchBuilder<BlockBuilder<P>> {
        return new SwitchBuilder(stmt => {
            this._stmts.push(stmt)
            return this
        })
    }
    loop(): LoopBuilder<BlockBuilder<P>> {
        return new LoopBuilder(stmt => {
            this._stmts.push(stmt)
            return this
        })
    }
    return(type?: LWType): ReturnBuilder<BlockBuilder<P>> {
        return new ReturnBuilder(stmt => {
            this._stmts.push(stmt)
            return this
        }, type)
    }
    $(): P {
        return this._cont(this._stmts)
    }
}

class ParamBuilder<P> {
    constructor(
        private _cont: (name: string, type: LWType) => P,
        private _name: string
    ) {}
    private _type?: LWType
    type(type: LWType) { this._type = type; return this }
    typeStr(type: string) { this._type = T.c(type); return this }
    $(): P {
        check("Parameter", this._type)
        return this._cont(this._name, this._type!)
    }
}

class FunctionTypeBuilder<P> {
    constructor(private _cont: (type: FunctionalType) => P) {}
    private _parameters: [name: string, type: LWType][] = []
    private _returnType?: LWType
    returns(type: LWType) { this._returnType = type; return this }
    parameters(params: [name: string, type: LWType][]) { this._parameters.push(...params); return this }
    param(name: string): ParamBuilder<FunctionTypeBuilder<P>> {
        return new ParamBuilder((name, type) => {
            this._parameters.push([name, type])
            return this
        }, name)
    }
    $(): P {
        check("FunctionType", this._returnType)
        return this._cont(T.fn(this._parameters, this._returnType!))
    }
}

class FunctionBuilder<P> {
    constructor(
        private _cont: (decl: FunctionDeclaration) => P,
        private _name: string
    ) {}
    private _modifiers: Modifier[] = []
    private _parameters: { name: string, type: LWType }[] = []
    private _returnType?: LWType
    private _body?: LWStatement
    private _annotations: Annotation[] = []
    native() { this._modifiers.push(Md.native()); return this }
    static() { this._modifiers.push(Md.static()); return this }
    private() { this._modifiers.push(Md.private()); return this }
    returns(type: LWType) { this._returnType = type; return this }
    body(body: LWStatement) { this._body = body; return this }
    parameters(params: FunctionDeclaration['parameters']) { this._parameters.push(...params); return this }
    param(name: string): ParamBuilder<FunctionBuilder<P>> {
        return new ParamBuilder((name, type) => {
            this._parameters.push({name, type})
            return this
        }, name)
    }
    block(): BlockBuilder<FunctionBuilder<P>> {
        return new BlockBuilder(stmts => {
            this._body = S.block(stmts)
            return this
        })
    }
    annotation(name: string) {
        const annotation: SimpleAnnotation = {
            kind: DecoratorKind.SimpleAnnotation,
            name,
        }
        this._annotations.push(annotation)
        return this
    }
    macro(name: string, ...args: (string | LWType)[]) {
        const annotation: MacroInvocation = {
            kind: DecoratorKind.MacroCall,
            name,
            args,
        }
        this._annotations.push(annotation)
        return this
    }
    $(): P {
        return this._cont(
            DD({generics: [], modifiers: this._modifiers})
                .func(this._name, this._parameters,
                    this._returnType ?? Ts.prim.void,
                    this._body, this._annotations))
    }
}

class FieldBuilder<P> {
    constructor(
        private _cont: (name: string, type: LWType, modifiers?: Modifier[]) => P,
        private _name: string
    ) {}
    private _type?: LWType
    private _modifiers: Modifier[] = []
    static() { this._modifiers.push(Md.static()); return this }
    optional() { this._modifiers.push(Md.optional()); return this }
    readonly() { this._modifiers.push(Md.readonly()); return this }
    modifiers(modifiers: Modifier[]) { this._modifiers.push(...modifiers); return this }
    type(type: LWType) { this._type = type; return this }
    funcType(): FunctionTypeBuilder<FieldBuilder<P>> {
        return new FunctionTypeBuilder(type => {
            this._type = type
            return this
        })
    }
    $(): P {
        check("Field", this._name, this._type)
        return this._cont(this._name!, this._type!, this._modifiers)
    }
}

class StructBuilder {
    constructor(private _name: string) {}
    private _fields: { name: string, type: LWType, modifiers?: Modifier[] }[] = []
    field(name: string): FieldBuilder<StructBuilder> {
        return new FieldBuilder((name, type, modifiers) => {
            this._fields.push({name, type, modifiers})
            return this
        }, name)
    }
    $(): StructureDeclaration {
        check("Struct", this._name)
        return D.struct(this._name, this._fields)
    }
}

class ClassBuilder {///extend StructB
    constructor(private _name: string) {}
    private _fields: { name: string, type: LWType, modifiers?: Modifier[] }[] = []
    private _methods: FunctionDeclaration[] = []
    private _oop: ClassDeclaration['oop'] = {
        kind: 'class',
        base: undefined,
        implementations: []
    }
    extends(type: LWType) { this._oop!.base = type; return this }
    implements(type: LWType) { this._oop!.implementations?.push(type); return this }
    interface() { this._oop!.kind = 'interface'; return this }
    field(name: string): FieldBuilder<ClassBuilder> {
        return new FieldBuilder((name, type, modifiers) => {
            this._fields.push({name, type, modifiers})
            return this
        }, name)
    }
    method(name: string): FunctionBuilder<ClassBuilder> {
        return new FunctionBuilder(func => {
            this._methods.push(func)
            return this
        }, name)
    }
    ctor(): FunctionBuilder<ClassBuilder> {
        return this.method(std.names.members.ctor)
    }
    $(): ClassDeclaration {
        check("Class", this._name)
        return D.class(this._name!, this._fields, this._methods, this._oop)
    }
}

class EnumBuilder {
    constructor(private _name: string) {}
    private _members: EnumDeclaration['members'] = []
    member(name: string, value?: number | string) { this._members.push({name, value}); return this }
    members(members: EnumDeclaration['members']) { this._members.push(...members); return this; }
    $(): EnumDeclaration {
        return D.enum(this._name, this._members)
    }
}

class TypedefBuilder {
    constructor(private _name: string) {}
    private _type?: LWType
    funcType(): FunctionTypeBuilder<TypedefBuilder> {
        return new FunctionTypeBuilder(type => {
            this._type = type
            return this
        })
    }
    $(): TypedefDeclaration {
        check("Type", this._type)
        return D.type(this._name, this._type!)
    }
}

export class Builders {
    static expr(): ExpressionBuilder<LWExpression> { return new ExpressionBuilder(id) }
    static stmt(): StatementBuilder<LWStatement> { return new StatementBuilder(id) }
    static func(name: string): FunctionBuilder<FunctionDeclaration> { return new FunctionBuilder(id, name) }
    static struct(name: string): StructBuilder { return new StructBuilder(name) }
    static class(name: string): ClassBuilder { return new ClassBuilder(name) }
    static enum(name: string): EnumBuilder { return new EnumBuilder(name) }
    static type(name: string): TypedefBuilder { return new TypedefBuilder(name) }

    static access(accessor?: string | LWExpression): AccessorBuilder<AccessorExpression> { return new AccessorBuilder(id, accessor) }
    static binary(op: string): BinaryBuilder<BinaryExpression> { return new BinaryBuilder(id, op) }
    static unary(op: string): UnaryBuilder<UnaryExpression> { return new UnaryBuilder(id, op) }
    static call(func?: string | LWExpression): CallBuilder<CallExpression> { return new CallBuilder(id, func) }
    static cast(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'cast', type) }
    static instanceof(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'instanceof', type) }
    static ctor(name?: string): ConstructorBuilder<ConstructorExpression> { return new ConstructorBuilder(id, name) }

    static block(): BlockBuilder<LWStatement> { return new BlockBuilder(S.block) }
    static decl(name: string, type?: LWType): DeclarationBuilder<DeclarationStatement> { return new DeclarationBuilder(id, name, type) }
    static if(): IfBuilder<IfStatement> { return new IfBuilder(id) }
    static switch(): SwitchBuilder<SwitchStatement> { return new SwitchBuilder(id) }
    static loop(): LoopBuilder<LoopStatement> { return new LoopBuilder(id) }
    static return(type?: LWType): ReturnBuilder<LWStatement> { return new ReturnBuilder(id, type) }
}
