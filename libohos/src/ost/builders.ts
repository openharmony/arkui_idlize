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
import { AccessorExpression, Hint, BinaryExpression, CallExpression, ClassDeclaration, ConstructorExpression, DeclarationStatement, ExpressionStatement, FunctionDeclaration, IfStatement, LoopStatement, LWExpression, LWKind, LWStatement, LWType, Modifier, StructureDeclaration, Annotation, SimpleAnnotation, DecoratorKind, MacroInvocation, UnaryExpression, CheckCastExpression, FunctionalType } from "./lws"
import { Hs, Md, std, Ts } from "./stdlib";

const id = <T>(it: T) => it

function check(desc: string, ...data: any[]) {
    if (data.includes(undefined))
        throw new Error(desc + ' not fully initialized: ' + data.join(", "))
}

class AccessorBuilder<P> {
    constructor(
        private _cont: (expr: AccessorExpression) => P,
        private _object?: LWExpression
    ) {}
    private _accessor?: string | LWExpression
    private _hints: Hint[] = []
    ptr() { this._object?.hints.push(Hs.ptrVal()); return this }
    static() { this._hints.push(Hs.staticMethod()); return this }
    excl() { this._hints.push(Hs.excl()); return this }
    member(name: string) { this._accessor = name; return this }
    indexExpr(expr: LWExpression) { this._accessor = expr; return this }
    indexStr(str: string) { this._accessor = E.v(str); return this }
    index(): ExpressionBuilder<AccessorBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._accessor = expr
            return this
        })
    }
    object(): ExpressionBuilder<AccessorBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._object = expr
            return this
        })
    }
    $(): P {
        check("Accessor", this._object, this._accessor)
        return this._cont(E.get(this._object!, this._accessor!, this._hints))
    }
}

class UnaryBuilder<P> {
    constructor(private _cont: (expr: UnaryExpression) => P, private op: string) {}
    private _expr?: LWExpression
    valueExpr(value: LWExpression) { this._expr = value; return this }
    valueStr(str: string) { this._expr = E.v(str); return this }
    value(): ExpressionBuilder<UnaryBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._expr = expr
            return this
        })
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
    leftExpr(value: LWExpression) { this._lhs = value; return this }
    leftStr(str: string) { this._lhs = E.v(str); return this }
    rightExpr(value: LWExpression) { this._rhs = value; return this }
    rightStr(str: string | number) { this._rhs = E.v(str.toString()); return this }
    left(): ExpressionBuilder<BinaryBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._lhs = expr
            return this
        })
    }
    right(): ExpressionBuilder<BinaryBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._rhs = expr
            return this
        })
    }
    $(): P {
        check("Binary", this._lhs, this._rhs)
        return this._cont(E.bin(this.op, this._lhs!, this._rhs!))
    }
}

class ArgBuilder<P> {
    constructor(
        private _cont: (arg: LWExpression) => P,
        private _arg?: LWExpression
    ) {}
    access(object?: LWExpression): AccessorBuilder<ArgBuilder<P>> {
        return new AccessorBuilder(arg => {
            this._arg = arg
            return this
        }, object)
    }
    call(): CallBuilder<ArgBuilder<P>> {
        return new CallBuilder(arg => {
            this._arg = arg
            return this
        })
    }
    $(): P {
        check("Arg", this._arg)
        return this._cont(this._arg!)
    }
}

class CallBuilder<P> {
    constructor(private _cont: (expr: CallExpression) => P) {}
    private _callee?: LWExpression
    private _receiver?: LWExpression
    private _function?: string
    private _args: LWExpression[] = []
    receiverName(name: string, hints?: Hint[]) { this._receiver = E.v(name, hints); return this }
    receiverExpr(object: LWExpression) { this._receiver = object; return this }
    functionName(name: string) { this._function = name; return this }
    functionExpr(expr: LWExpression) { this._callee = expr; return this }
    args(args: LWExpression[]) { this._args.push(...args); return this }
    receiver(): ExpressionBuilder<CallBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._receiver = expr
            return this
        })
    }
    function(): ExpressionBuilder<CallBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._callee = expr
            return this
        })
    }
    arg(value?: string): ArgBuilder<CallBuilder<P>> {
        return new ArgBuilder(arg => {
            this._args.push(arg)
            return this
        }, value ? E.v(value) : undefined)
    }
    $(): P {
        if (!this._callee) {
            check("Call", this._function)
            this._callee = this._receiver ? E.get(this._receiver, this._function!) : E.v(this._function!)
        }
        return this._cont(E.call(this._callee, this._args))
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
    arg(value?: string): ArgBuilder<ConstructorBuilder<P>> {
        return new ArgBuilder(arg => {
            this._args.push(arg)
            return this
        }, value ? E.v(value) : undefined)
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
    valueExpr(value: LWExpression) { this._expr = value; return this }
    valueStr(value: string) { this._expr = E.v(value); return this }
    value(): ExpressionBuilder<CheckCastBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._expr = expr
            return this
        })
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
    access(object?: LWExpression): AccessorBuilder<ExpressionBuilder<P>> {
        return new AccessorBuilder(expr => {
            this._expr = expr
            return this
        }, object)
    }
    binary(op: string): BinaryBuilder<ExpressionBuilder<P>> {
        return new BinaryBuilder(expr => {
            this._expr = expr
            return this
        }, op)
    }
    unary(op: string): UnaryBuilder<ExpressionBuilder<P>> {
        return new UnaryBuilder(expr => {
            this._expr = expr
            return this
        }, op)
    }
    call(): CallBuilder<ExpressionBuilder<P>> {
        return new CallBuilder(expr => {
            this._expr = expr
            return this
        })
    }
    ctor(name?: string): ConstructorBuilder<ExpressionBuilder<P>> {
        return new ConstructorBuilder(expr => {
            this._expr = expr
            return this
        }, name)
    }
    cast(type: LWType): CheckCastBuilder<ExpressionBuilder<P>> {
        return new CheckCastBuilder(expr => {
            this._expr = expr
            return this
        }, 'cast', type)
    }
    instanceof(type: LWType): CheckCastBuilder<ExpressionBuilder<P>> {
        return new CheckCastBuilder(expr => {
            this._expr = expr
            return this
        }, 'instanceof', type)
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
    private _expression?: LWExpression
    mutable() { this._mutable = true; return this }
    static() { this._static = true; return this }
    valueExpr(expr: LWExpression) { this._expression = expr; return this }
    valueStr(str: string | number) { this._expression = E.v(str.toString()); return this }
    value(): ExpressionBuilder<DeclarationBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._expression = expr
            return this
        })
    }
    $(): P {
        const type = this._type ?? T.c(std.names.types.auto)
        return this._cont(S.declaration(this._name, type, this._mutable, this._expression, this._static))
    }
}

class ReturnBuilder<P> {
    constructor(private _cont: (stmt: LWStatement) => P, private _type?: LWType) {}
    private _expr?: LWExpression
    valueExpr(expr: LWExpression) { this._expr = expr; return this }
    valueStr(value: string) { this._expr = E.v(value); return this }
    value(): ExpressionBuilder<ReturnBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._expr = expr
            return this
        })
    }
    access(object?: LWExpression): AccessorBuilder<ReturnBuilder<P>> {
        return new AccessorBuilder(expr => {
            this._expr = expr
            return this
        }, object)
    }
    binary(op: string): BinaryBuilder<ReturnBuilder<P>> {
        return new BinaryBuilder(expr => {
            this._expr = expr
            return this
        }, op)
    }
    unary(op: string): UnaryBuilder<ReturnBuilder<P>> {
        return new UnaryBuilder(expr => {
            this._expr = expr
            return this
        }, op)
    }
    call(): CallBuilder<ReturnBuilder<P>> {
        return new CallBuilder(expr => {
            this._expr = expr
            return this
        })
    }
    cast(type: LWType): CheckCastBuilder<ReturnBuilder<P>> {
        return new CheckCastBuilder(expr => {
            this._expr = expr
            return this
        }, 'cast', type)
    }
    instanceof(type: LWType): CheckCastBuilder<ReturnBuilder<P>> {
        return new CheckCastBuilder(expr => {
            this._expr = expr
            return this
        }, 'instanceof', type)
    }
    ctor(name?: string): ConstructorBuilder<ReturnBuilder<P>> {
        return new ConstructorBuilder(expr => {
            this._expr = expr
            return this
        }, name)
    }
    $(): P {
        if (this._expr) {
            // either `return e` or just `e`
            const wrap = this._type === Ts.prim.void ? S.e : S.return
            return this._cont(wrap(this._expr!))
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
    cond(): ExpressionBuilder<IfBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._cond = expr
            return this
        })
    }
    then(): StatementBuilder<IfBuilder<P>> {
        return new StatementBuilder(stmt => {
            this._then = stmt
            return this
        })
    }
    else(): StatementBuilder<IfBuilder<P>> {
        return new StatementBuilder(stmt => {
            this._else = stmt
            return this
        })
    }
    $(): P {
        check("If", this._cond, this._then)
        return this._cont(S.if(this._cond!, this._then!, this._else))
    }
}

class LoopBuilder<P> {
    constructor(private _cont: (stmt: LoopStatement) => P) {}
    private _init?: LWStatement
    private _cond?: LWExpression
    private _step?: LWStatement
    private _body?: LWStatement
    condition(cond: LWExpression) { this._cond = cond; return this }
    bodyStmt(body: LWStatement) { this._body = body; return this }
    init(): StatementBuilder<LoopBuilder<P>> {
        return new StatementBuilder(stmt => {
            this._init = stmt
            return this
        })
    }
    cond(): ExpressionBuilder<LoopBuilder<P>> {
        return new ExpressionBuilder(expr => {
            this._cond = expr
            return this
        })
    }
    step(): StatementBuilder<LoopBuilder<P>> {
        return new StatementBuilder(stmt => {
            this._step = stmt
            return this
        })
    }
    body(): StatementBuilder<LoopBuilder<P>> {
        return new StatementBuilder(stmt => {
            this._body = stmt
            return this
        })
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
        return new BinaryBuilder(stmt => {
            this._stmt = S.e(stmt)
            return this
        }, op)
    }
    unary(op: string): UnaryBuilder<StatementBuilder<P>> {
        return new UnaryBuilder(stmt => {
            this._stmt = S.e(stmt)
            return this
        }, op)
    }
    block(): BlockBuilder<StatementBuilder<P>> {
        return new BlockBuilder(stmts => {
            this._stmt = S.block(stmts)
            return this
        })
    }
    call(): CallBuilder<StatementBuilder<P>> {
        return new CallBuilder(stmt => {
            this._stmt = S.e(stmt)
            return this
        })
    }
    decl(name: string, type?: LWType): DeclarationBuilder<StatementBuilder<P>> {
        return new DeclarationBuilder(stmt => {
            this._stmt = stmt
            return this
        }, name, type)
    }
    if(): IfBuilder<StatementBuilder<P>> {
        return new IfBuilder(stmt => {
            this._stmt = stmt
            return this
        })
    }
    loop(): LoopBuilder<StatementBuilder<P>> {
        return new LoopBuilder(stmt => {
            this._stmt = stmt
            return this
        })
    }
    return(type?: LWType): ReturnBuilder<StatementBuilder<P>> {
        return new ReturnBuilder(stmt => {
            this._stmt = stmt
            return this
        }, type)
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
    call(): CallBuilder<BlockBuilder<P>> {
        return new CallBuilder(stmt => {
            this._stmts.push(S.e(stmt))
            return this
        })
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
        return D.struct(this._name!, this._fields)
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

export class Builders {
    static expr(): ExpressionBuilder<LWExpression> { return new ExpressionBuilder(id) }
    static stmt(): StatementBuilder<LWStatement> { return new StatementBuilder(id) }
    static func(name: string): FunctionBuilder<FunctionDeclaration> { return new FunctionBuilder(id, name) }
    static struct(name: string): StructBuilder { return new StructBuilder(name) }
    static class(name: string): ClassBuilder { return new ClassBuilder(name) }

    static access(object?: LWExpression): AccessorBuilder<AccessorExpression> { return new AccessorBuilder(id, object) }
    static binary(op: string): BinaryBuilder<BinaryExpression> { return new BinaryBuilder(id, op) }
    static unary(op: string): UnaryBuilder<UnaryExpression> { return new UnaryBuilder(id, op) }
    static call(): CallBuilder<CallExpression> { return new CallBuilder(id) }
    static cast(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'cast', type) }
    static instanceof(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'instanceof', type) }
    static ctor(name?: string): ConstructorBuilder<ConstructorExpression> { return new ConstructorBuilder(id, name) }

    static block(): BlockBuilder<LWStatement> { return new BlockBuilder(S.block) }
    static decl(name: string, type?: LWType): DeclarationBuilder<DeclarationStatement> { return new DeclarationBuilder(id, name, type) }
    static if(): IfBuilder<IfStatement> { return new IfBuilder(id) }
    static loop(): LoopBuilder<LoopStatement> { return new LoopBuilder(id) }
    static return(type?: LWType): ReturnBuilder<LWStatement> { return new ReturnBuilder(id, type) }
}
