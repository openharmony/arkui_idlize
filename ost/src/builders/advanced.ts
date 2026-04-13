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

import { id } from "@idlizer/core"
import { D, DD, E, S, T } from "./original.js"
import {
    AccessorExpression, Hint, BinaryExpression, CallExpression, ClassDeclaration,
    ConstructorExpression, DeclarationStatement, ExpressionStatement, FunctionDeclaration,
    IfStatement, LoopStatement, LWExpression, LWKind, LWStatement, LWType, Modifier,
    StructureDeclaration, Annotation, SimpleAnnotation, DecoratorKind, MacroInvocation,
    UnaryExpression, CheckCastExpression, LambdaExpression, FunctionalType, TypedefDeclaration,
    EnumDeclaration, SwitchStatement, ConstantExpression,
    ThrowStatement,
} from "../lws.js"
import { Hs, Md, std, Ts } from "../stdlib.js";

/**
 * Advanced fluent builder API for constructing AST nodes.
 *
 * This module provides a fluent, chainable API for building AST nodes.
 * The main entry point is the `Builders` class, which provides factory methods
 * for creating expression, statement, type, and declaration builders.
 *
 * Unlike the original builders, these builders support partial construction
 * and method chaining, with a `$()` method to finalize construction.
 *
 * @example
 * ```typescript
 * import { Builders } from '@idlizer/ost';
 *
 * // Create a binary expression fluently
 * const expr = Builders.expr()
 *   .binary('+')
 *   .left(1)
 *   .right(2)
 *   .$();
 *
 * // Create a function with parameters and body
 * const func = Builders.func()
 *   .name('calculate')
 *   .param('x', T.number())
 *   .returns(T.number())
 *   .body(b => b.ret(b.expr().binary('*').left('x').right(2).$()))
 *   .$();
 * ```
 */

/**
 * Type representing values that can be automatically converted to expressions.
 * Strings and numbers are automatically wrapped in constant expressions.
 */
type ExpressionLike = string | number | LWExpression

/**
 * Creates a function that transforms a value and assigns it to an object property.
 * Used internally for builder property assignment with transformation.
 *
 * @param obj - Target object
 * @param prop - Property name to assign to
 * @param xform - Transformation function to apply to the value
 * @returns Function that takes a value, transforms it, and assigns it
 */
const morphInto = <T, V, R>(obj: T, prop: string, xform: (value: V) => R) => (value: V) => {
    obj[prop as keyof T] = xform(value) as T[keyof T]
    return obj
}

/**
 * Creates a function that assigns a value directly to an object property.
 * Special case of `morphInto` with identity transformation.
 *
 * @param obj - Target object
 * @param prop - Property name to assign to
 * @returns Function that takes a value and assigns it directly
 */
const saveInto = <T, V>(obj: T, prop: string) => morphInto<T, V, V>(obj, prop, id)

/**
 * Apply a value to a transformation function, with support for deferred application.
 * If value is undefined, returns an ExpressionBuilder for deferred construction.
 * Otherwise, converts the value to an expression (if needed) and applies the function.
 *
 * @param value - Value to apply (or undefined for deferred construction)
 * @param f - Transformation function to apply
 * @returns Either the transformed result or an ExpressionBuilder for deferred construction
 */
function apply<T>(value: ExpressionLike | undefined, f: (expr: LWExpression) => T): T | ExpressionBuilder<T> {
    if (value === undefined)
        return new ExpressionBuilder(f)
    return f(typeof value === 'object' ? value : typeof value === 'number' ? E.c(value) : E.v(value))
}
/**
 * Assign a value to an object property with support for deferred assignment.
 * If value is undefined, returns an ExpressionBuilder for deferred assignment.
 * Otherwise, assigns the value directly.
 *
 * @param obj - Target object
 * @param prop - Property name to assign to
 * @param value - Value to assign (or undefined for deferred assignment)
 * @returns Either the object with assigned value or an ExpressionBuilder for deferred assignment
 */
function assign<T>(obj: T, prop: string, value?: ExpressionLike): T | ExpressionBuilder<T> {
    return apply(value, saveInto(obj, prop))
}
/**
 * Push a value to an array property with support for deferred pushing.
 * If value is undefined, returns an ExpressionBuilder for deferred pushing.
 * Otherwise, pushes the value to the array.
 *
 * @param obj - Target object
 * @param prop - Array property name to push to
 * @param value - Value to push (or undefined for deferred pushing)
 * @returns Either the object with pushed value or an ExpressionBuilder for deferred pushing
 */
function push<T>(obj: T, prop: string, value?: ExpressionLike): T | ExpressionBuilder<T> {
    return apply(value, expr => {
        (obj[prop as keyof T] as LWExpression[]).push(expr)
        return obj
    })
}

/**
 * Check that all required values are defined (not undefined).
 * Throws an error if any value is undefined.
 *
 * @param desc - Description of what's being checked (for error message)
 * @param data - Values to check
 * @throws Error if any value is undefined
 */
function check(desc: string, ...data: any[]) {
    if (data.includes(undefined))
        throw new Error(desc + ' not fully initialized: ' + data.join(", "))
}

/**
 * Builder for creating accessor expressions (property/member access).
 * Supports both property access (obj.field) and index access (array[index]).
 *
 * @typeParam P - The type returned by the continuation function (usually AccessorExpression or a parent builder)
 *
 * @example
 * ```typescript
 * // obj.property
 * const accessor = Builders.access('property')
 *   .receiver('obj')
 *   .$();
 *
 * // array[index]
 * const indexAccess = Builders.access()
 *   .receiver('array')
 *   .index('index')
 *   .$();
 * ```
 */
class AccessorBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param _accessor - Optional accessor (property name or index expression)
     */
    constructor(
        private _cont: (expr: AccessorExpression) => P,
        private _accessor?: string | LWExpression
    ) {}
    private _receiver?: LWExpression
    private _receiverHints: Hint[] = []
    private _hints: Hint[] = []
    /** Add ptrVal hint to the receiver expression (indicates pointer value). */
    ptr() { this._receiverHints.push(Hs.ptrVal()); return this }
    /** Add staticMethod hint to the accessor expression. */
    static() { this._hints.push(Hs.staticMethod()); return this }
    /** Add excl hint to the accessor expression. */
    excl() { this._hints.push(Hs.excl()); return this }
    /**
     * Set the member name for property access.
     * @param name - Property name
     * @returns This builder for chaining
     */
    member(name: string) { this._accessor = name; return this }
    /**
     * Set the index expression for index access (array[index]).
     * If called without arguments, returns an ExpressionBuilder for deferred index specification.
     * @param value - Index expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    index(value: ExpressionLike): this
    index(): ExpressionBuilder<this>
    index(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_accessor', value)
    }
    /**
     * Set the receiver expression (the object being accessed).
     * If called without arguments, returns an ExpressionBuilder for deferred receiver specification.
     * @param value - Receiver expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    receiver(value: ExpressionLike): this
    receiver(): ExpressionBuilder<this>
    receiver(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_receiver', value)
    }
    /**
     * Finalize the builder and return the constructed accessor expression.
     * @returns The built AccessorExpression
     * @throws Error if receiver or accessor is not specified
     */
    $(): P {
        check("Accessor", this._receiver, this._accessor)
        this._receiver!.hints.push(...this._receiverHints)
        return this._cont(E.get(this._receiver!, this._accessor!, this._hints))
    }
}

/**
 * Builder for creating unary expressions (e.g., -x, !y, ~z).
 *
 * @typeParam P - The type returned by the continuation function (usually UnaryExpression or a parent builder)
 */
class UnaryBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     */
    constructor(private _cont: (expr: UnaryExpression) => P, private op: string) {}
    private _expr?: LWExpression
    /**
     * Set the operand expression for the unary operation.
     * If called with an argument, sets the operand directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred operand specification.
     *
     * @param expr - Operand expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    value(expr: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(expr?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_expr', expr)
    }
    /**
     * Finalize the builder and return the constructed unary expression.
     *
     * @returns The built UnaryExpression
     * @throws Error if operand expression is not specified
     */
    $(): P {
        check("Unary", this._expr)
        return this._cont(E.unary(this.op, this._expr!))
    }
}

/**
 * Builder for creating binary expressions (e.g., x + y, a && b, c == d).
 *
 * @typeParam P - The type returned by the continuation function (usually BinaryExpression or a parent builder)
 */
class BinaryBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     */
    constructor(private _cont: (expr: BinaryExpression) => P, private op: string) {}
    private _lhs?: LWExpression
    private _rhs?: LWExpression
    /**
     * Set the left-hand side expression for the binary operation.
     * If called with an argument, sets the LHS directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred LHS specification.
     *
     * @param value - Left-hand side expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    left(value: ExpressionLike): this
    left(): ExpressionBuilder<this>
    left(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_lhs', value)
    }
    /**
     * Set the right-hand side expression for the binary operation.
     * If called with an argument, sets the RHS directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred RHS specification.
     *
     * @param value - Right-hand side expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    right(value: ExpressionLike): this
    right(): ExpressionBuilder<this>
    right(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_rhs', value)
    }
    /**
     * Finalize the builder and return the constructed binary expression.
     *
     * @returns The built BinaryExpression
     * @throws Error if left or right expression is not specified
     */
    $(): P {
        check("Binary", this._lhs, this._rhs)
        return this._cont(E.bin(this.op, this._lhs!, this._rhs!))
    }
}

/**
 * Builder for creating function call expressions (e.g., f(x), obj.method(a, b)).
 *
 * @typeParam P - The type returned by the continuation function (usually CallExpression or a parent builder)
 */
class CallBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param _func - Optional function name or expression (can be set later via `function()` method)
     */
    constructor(
        private _cont: (expr: CallExpression) => P,
        private _func?: string | LWExpression
    ) {}
    private _receiver?: LWExpression
    private _args: LWExpression[] = []
    private _typeArgs: LWType[] = []

    /**
     * Set the receiver expression (the object on which the method is called).
     * If called with an argument, sets the receiver directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred receiver specification.
     *
     * @param value - Receiver expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    receiver(value: ExpressionLike): this
    receiver(): ExpressionBuilder<this>
    receiver(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_receiver', value)
    }
    /**
     * Add multiple arguments to the function call.
     *
     * @param args - Array of argument expressions
     * @returns This builder for chaining
     */
    args(args: LWExpression[]) { this._args.push(...args); return this }
    /**
     * Set the function expression using a deferred expression builder.
     * Returns an ExpressionBuilder for specifying the function expression.
     *
     * @returns ExpressionBuilder for deferred function specification
     */
    function(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_func'))
    }
    /**
     * Add a single argument to the function call.
     * If called with an argument, adds the argument directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred argument specification.
     *
     * @param value - Argument expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    arg(value: ExpressionLike): this
    arg(): ExpressionBuilder<this>
    arg(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return push(this, '_args', value)
    }
    /**
     * Add multiple type parameters (generics) to the call.
     *
     * @param args - Array of type parameters
     * @returns This builder for chaining
     */
    typeArgs(args: LWType[]) { this._typeArgs.push(...args); return this }
    /**
     * Finalize the builder and return the constructed call expression.
     *
     * @returns The built CallExpression
     * @throws Error if function expression is not specified
     */
    $(): P {
        check("Call", this._func)
        const callee = this._receiver ? E.get(this._receiver, this._func!)
            : typeof this._func === 'object' ? this._func
            : E.v(this._func!)
        return this._cont(E.call(callee, this._args, this._typeArgs))
    }
}

/**
 * Builder for creating constructor expressions (new instances).
 *
 * @typeParam P - The type returned by the continuation function (usually ConstructorExpression or a parent builder)
 */
class ConstructorBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param _name - Optional type/class name (can be omitted if constructing from type)
     */
    constructor(
        private _cont: (expr: ConstructorExpression) => P,
        private _name?: string
    ) {}
    private _args: LWExpression[] = []
    private _typeArgs: LWType[] = []
    private _hints: Hint[] = []
    /**
     * Add asStruct hint to indicate the instance should be constructed as a struct (value type).
     *
     * @returns This builder for chaining
     */
    asStruct() { this._hints.push(Hs.asStruct()); return this }
    /**
     * Add arrayInstance hint to indicate the instance should be constructed as an array.
     *
     * @returns This builder for chaining
     */
    array() { this._hints.push(Hs.arrayInstance()); return this }
    /**
     * Add promise hint to indicate the instance should be constructed as a promise.
     *
     * @returns This builder for chaining
     */
    promise() { this._hints.push(Hs.promise()); return this }
    /**
     * Add stackInstance hint to indicate the instance should be allocated on the stack.
     *
     * @returns This builder for chaining
     */
    stack() { this._hints.push(Hs.stackInstance()); return this }
    /**
     * Add multiple constructor arguments.
     *
     * @param args - Array of argument expressions
     * @returns This builder for chaining
     */
    args(args: LWExpression[]) { this._args.push(...args); return this }
    /**
     * Add a single constructor argument.
     * If called with an argument, adds the argument directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred argument specification.
     *
     * @param value - Argument expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    arg(value: ExpressionLike): this
    arg(): ExpressionBuilder<this>
    arg(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return push(this, '_args', value)
    }
    /**
     * Add multiple type arguments (generics) to the constructor.
     *
     * @param args - Array of type arguments
     * @returns This builder for chaining
     */
    typeArgs(args: LWType[]) { this._typeArgs.push(...args); return this }
    /**
     * Finalize the builder and return the constructed constructor expression.
     *
     * @returns The built ConstructorExpression
     */
    $(): P {
        return this._cont(E.instance(this._name ?? 'CTOR_NAME_MISSING', this._args, this._typeArgs, this._hints))
    }
}

/**
 * Builder for creating type check/cast expressions (e.g., (Type)x, x instanceof Type).
 *
 * @typeParam P - The type returned by the continuation function (usually CheckCastExpression or a parent builder)
 */
class CheckCastBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     * @param _op - Operation type: 'cast' for type cast, 'instanceof' for type check
     * @param _type - Target type for cast/check
     */
    constructor(
        private _cont: (expr: CheckCastExpression) => P,
        private _op: 'cast' | 'instanceof',
        private _type: LWType
    ) {}
    private _expr?: LWExpression
    private _hints: Hint[] = []
    /**
     * Add staticMethod hint to indicate a static cast/check operation.
     *
     * @returns This builder for chaining
     */
    static() { this._hints.push(Hs.staticMethod()); return this }
    /**
     * Set the expression to be cast/checked.
     * If called with an argument, sets the expression directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred expression specification.
     *
     * @param value - Expression to cast/check (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_expr', value)
    }
    /**
     * Finalize the builder and return the constructed cast/check expression.
     *
     * @returns The built CheckCastExpression
     * @throws Error if expression is not specified
     */
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

/**
 * Builder for creating lambda expressions (anonymous functions).
 *
 * @typeParam P - The type returned by the continuation function (usually LambdaExpression or a parent builder)
 */
class LambdaBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     */
    constructor(private _cont: (expr: LambdaExpression) => P) {}
    private _parameters: LambdaExpression['parameters'] = []
    private _body: LWStatement | undefined
    private _closure: string[] = []
    /**
     * Add closure/captured variable names to the lambda.
     *
     * @param names - Variable names to capture
     * @returns This builder for chaining
     */
    closure(...names: string[]) { this._closure.push(...names); return this }
    /**
     * Add multiple parameters to the lambda.
     *
     * @param params - Array of parameter descriptors (name and type)
     * @returns This builder for chaining
     */
    parameters(params: LambdaExpression['parameters']) { this._parameters.push(...params); return this }
    /**
     * Add a single parameter to the lambda using a parameter builder.
     * Returns a ParamBuilder for specifying the parameter type.
     *
     * @param name - Parameter name
     * @returns ParamBuilder for deferred parameter type specification
     */
    param(name: string): ParamBuilder<this> {
        return new ParamBuilder((name, type) => {
            this._parameters.push({name, type})
            return this
        }, name)
    }
    /**
     * Set the lambda body using a statement builder.
     * Returns a StatementBuilder for specifying the lambda body.
     *
     * @returns StatementBuilder for deferred body specification
     */
    body(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_body'))
    }
    /**
     * Finalize the builder and return the constructed lambda expression.
     *
     * @returns The built LambdaExpression
     * @throws Error if body is not specified
     */
    $(): P {
        check('Lambda', this._body)
        return this._cont({
            kind: LWKind.LambdaExpression,
            parameters: this._parameters,
            body: this._body!,
            closure: this._closure,
            hints: []
        })
    }
}

/**
 * Builder for creating any type of expression.
 * Provides factory methods for creating specific expression builders.
 *
 * @typeParam P - The type returned by the continuation function (usually LWExpression or a parent builder)
 */
class ExpressionBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built expression
     */
    constructor(private _cont: (expr: LWExpression) => P) {}
    private _expr?: LWExpression
    /**
     * Create a constant expression from a string or number.
     *
     * @param value - Constant value
     * @returns This builder for chaining
     */
    const(value: string | number ): this { this._expr = E.c(value); return this }
    /**
     * Create a variable reference expression.
     *
     * @param name - Variable name
     * @returns This builder for chaining
     */
    var(name: string): this { this._expr = E.v(name); return this }
    type(type: LWType | string): this {
        this._expr = E.type(typeof type === 'string' ? T.c(type) : type)
        return this
    }
    /**
     * Create an accessor expression (property/member access).
     * Returns an AccessorBuilder for specifying receiver and accessor.
     *
     * @param accessor - Optional property name or index expression
     * @returns AccessorBuilder for deferred construction
     */
    access(accessor?: string | LWExpression): AccessorBuilder<this> {
        return new AccessorBuilder(saveInto(this, '_expr'), accessor)
    }
    /**
     * Create a binary expression.
     * Returns a BinaryBuilder for specifying left and right operands.
     *
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     * @returns BinaryBuilder for deferred construction
     */
    binary(op: string): BinaryBuilder<this> {
        return new BinaryBuilder(saveInto(this, '_expr'), op)
    }
    /**
     * Create a unary expression.
     * Returns a UnaryBuilder for specifying the operand.
     *
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     * @returns UnaryBuilder for deferred construction
     */
    unary(op: string): UnaryBuilder<this> {
        return new UnaryBuilder(saveInto(this, '_expr'), op)
    }
    /**
     * Create a function call expression.
     * Returns a CallBuilder for specifying function, receiver, and arguments.
     *
     * @param func - Optional function name or expression
     * @returns CallBuilder for deferred construction
     */
    call(func?: string | LWExpression): CallBuilder<this> {
        return new CallBuilder(saveInto(this, '_expr'), func)
    }
    /**
     * Create a constructor expression (new instance).
     * Returns a ConstructorBuilder for specifying type arguments and constructor arguments.
     *
     * @param name - Optional type/class name
     * @returns ConstructorBuilder for deferred construction
     */
    ctor(name?: string): ConstructorBuilder<this> {
        return new ConstructorBuilder(saveInto(this, '_expr'), name)
    }
    /**
     * Create a type cast expression ((Type)expr).
     * Returns a CheckCastBuilder for specifying the expression to cast.
     *
     * @param type - Target type for the cast
     * @returns CheckCastBuilder for deferred construction
     */
    cast(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_expr'), 'cast', type)
    }
    /**
     * Create a type check expression (expr instanceof Type).
     * Returns a CheckCastBuilder for specifying the expression to check.
     *
     * @param type - Target type for the check
     * @returns CheckCastBuilder for deferred construction
     */
    instanceof(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_expr'), 'instanceof', type)
    }
    /**
     * Create a lambda expression (anonymous function).
     * Returns a LambdaBuilder for specifying parameters and body.
     *
     * @returns LambdaBuilder for deferred construction
     */
    lambda(): LambdaBuilder<this> {
        return new LambdaBuilder(saveInto(this, '_expr'))
    }
    /**
     * Finalize the builder and return the constructed expression.
     *
     * @returns The built expression
     * @throws Error if no expression has been specified
     */
    $(): P {
        check("Expression", this._expr)
        return this._cont(this._expr!)
    }
    /**
     * Finalize the builder and return the expression wrapped as an expression statement.
     * Useful when the expression is intended to be used as a statement.
     *
     * @returns ExpressionStatement containing the built expression
     * @throws Error if no expression has been specified
     */
    $stmt(): ExpressionStatement {
        check("Expression", this._expr)
        return S.e(this._expr!)
    }
}

/**
 * Builder for creating variable declaration statements.
 *
 * @typeParam P - The type returned by the continuation function (usually DeclarationStatement or a parent builder)
 */
class DeclarationBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     * @param _name - Variable name
     * @param _type - Optional variable type (defaults to auto)
     */
    constructor(private _cont: (stmt: DeclarationStatement) => P, private _name: string, private _type?: LWType) {}
    private _mutable: boolean = false
    private _static: boolean = false
    private _value?: LWExpression
    /**
     * Mark the variable as mutable (non-const).
     *
     * @returns This builder for chaining
     */
    mutable() { this._mutable = true; return this }
    /**
     * Mark the variable as static (class-level).
     *
     * @returns This builder for chaining
     */
    static() { this._static = true; return this }
    type(type: LWType) { this._type = type; return this }
    /**
     * Define a functional type.
     * Returns a FunctionTypeBuilder for defining the function signature.
     *
     * @returns FunctionTypeBuilder for defining the function signature
     */
    funcType(): FunctionTypeBuilder<this> {
        return new FunctionTypeBuilder(type => {
            this._type = type
            return this
        })
    }
    /**
     * Set the initial value for the variable.
     * If called with an argument, sets the value directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred value specification.
     *
     * @param value - Initial value expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_value', value)
    }
    /**
     * Finalize the builder and return the constructed declaration statement.
     *
     * @returns The built DeclarationStatement
     */
    $(): P {
        const type = this._type ?? T.c(std.names.types.auto)
        return this._cont(S.declaration(this._name, type, this._mutable, this._value, this._static))
    }
}

/**
 * Builder for creating return statements or expression statements based on context.
 *
 * @typeParam P - The type returned by the continuation function (usually LWStatement or a parent builder)
 *
 * @example
 * ```typescript
 * // Return statement with value
 * const returnStmt = Builders.return()
 *   .value(42)
 *   .$();
 *
 * // Expression statement (when return type is void)
 * const exprStmt = Builders.return(Ts.prim.void)
 *   .value(someExpression)
 *   .$();
 * ```
 */
class ReturnBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     * @param _type - Optional return type (void for expression statements)
     */
    constructor(private _cont: (stmt: LWStatement) => P, private _type?: LWType) {}
    private _value?: LWExpression
    /**
     * Set the return value expression.
     * If called with an argument, sets the value directly and returns this builder.
     * If called without arguments, returns an ExpressionBuilder for deferred value specification.
     *
     * @param value - Return value expression (or undefined for deferred construction)
     * @returns This builder or ExpressionBuilder for deferred construction
     */
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_value', value)
    }
    /**
     * Create an accessor expression for the return value.
     * Returns an AccessorBuilder for specifying receiver and accessor.
     *
     * @param accessor - Optional property name or index expression
     * @returns AccessorBuilder for deferred construction
     */
    access(accessor?: string | LWExpression): AccessorBuilder<this> {
        return new AccessorBuilder(saveInto(this, '_value'), accessor)
    }
    /**
     * Create a binary expression for the return value.
     * Returns a BinaryBuilder for specifying left and right operands.
     *
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     * @returns BinaryBuilder for deferred construction
     */
    binary(op: string): BinaryBuilder<this> {
        return new BinaryBuilder(saveInto(this, '_value'), op)
    }
    /**
     * Create a unary expression for the return value.
     * Returns a UnaryBuilder for specifying the operand.
     *
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     * @returns UnaryBuilder for deferred construction
     */
    unary(op: string): UnaryBuilder<this> {
        return new UnaryBuilder(saveInto(this, '_value'), op)
    }
    /**
     * Create a function call expression for the return value.
     * Returns a CallBuilder for specifying function, receiver, and arguments.
     *
     * @param func - Optional function name or expression
     * @returns CallBuilder for deferred construction
     */
    call(func?: string | LWExpression): CallBuilder<this> {
        return new CallBuilder(saveInto(this, '_value'), func)
    }
    /**
     * Create a type cast expression for the return value.
     * Returns a CheckCastBuilder for specifying the expression to cast.
     *
     * @param type - Target type for the cast
     * @returns CheckCastBuilder for deferred construction
     */
    cast(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_value'), 'cast', type)
    }
    /**
     * Create a type check expression (instanceof) for the return value.
     * Returns a CheckCastBuilder for specifying the expression to check.
     *
     * @param type - Target type for the check
     * @returns CheckCastBuilder for deferred construction
     */
    instanceof(type: LWType): CheckCastBuilder<this> {
        return new CheckCastBuilder(saveInto(this, '_value'), 'instanceof', type)
    }
    /**
     * Create a constructor expression (new instance) for the return value.
     * Returns a ConstructorBuilder for specifying type arguments and constructor arguments.
     *
     * @param name - Optional type/class name
     * @returns ConstructorBuilder for deferred construction
     */
    ctor(name?: string): ConstructorBuilder<this> {
        return new ConstructorBuilder(saveInto(this, '_value'), name)
    }
    /**
     * Finalize the builder and return the constructed statement.
     * If a value has been specified:
     *   - Returns a return statement if the return type is not void
     *   - Returns an expression statement if the return type is void
     * If no value has been specified, returns a plain return statement (void return).
     *
     * @returns The built statement (ReturnStatement or ExpressionStatement)
     */
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

/**
 * Builder for creating none statement based on context.
 *
 * @typeParam P - The type returned by the continuation function (usually LWStatement or a parent builder)
 *
 * @example
 * ```typescript
 * const noneStmt = Builders.none().$()
 * ```
 */
class NoneBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: LWStatement) => P) {}

    $(): P {
        return this._cont(S.none())
    }
}

/**
 * Builder for creating if statements (conditional statements).
 *
 * @typeParam P - The type returned by the continuation function (usually IfStatement or a parent builder)
 *
 * @example
 * ```typescript
 * // Simple if statement
 * const ifStmt = Builders.if()
 *   .cond(b => b.expr().binary('>').left('x').right(0).$())
 *   .then(b => b.expr().call('print').arg('positive').$())
 *   .$();
 *
 * // If-else statement
 * const ifElse = Builders.if()
 *   .condition(someCondition)
 *   .then(someThenStatement)
 *   .else(someElseStatement)
 *   .$();
 * ```
 */
class IfBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: IfStatement) => P) {}
    private _cond?: LWExpression
    private _then?: LWStatement
    private _else?: LWStatement
    /**
     * Set the condition expression directly.
     *
     * @param cond - Condition expression
     * @returns This builder for chaining
     */
    condition(cond: LWExpression) { this._cond = cond; return this }
    /**
     * Set the condition expression using a deferred expression builder.
     * Returns an ExpressionBuilder for specifying the condition.
     *
     * @returns ExpressionBuilder for deferred condition specification
     */
    cond(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_cond'))
    }
    /**
     * Set the then branch using a deferred statement builder.
     * Returns a StatementBuilder for specifying the then branch.
     *
     * @returns StatementBuilder for deferred then branch specification
     */
    then(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_then'))
    }
    /**
     * Set the else branch using a deferred statement builder.
     * Returns a StatementBuilder for specifying the else branch.
     *
     * @returns StatementBuilder for deferred else branch specification
     */
    else(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_else'))
    }
    /**
     * Finalize the builder and return the constructed if statement.
     *
     * @returns The built IfStatement
     * @throws Error if condition or then branch is not specified
     */
    $(): P {
        check("If", this._cond, this._then)
        return this._cont(S.if(this._cond!, this._then!, this._else))
    }
}

class SwitchBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: SwitchStatement) => P) {}
    private _selector?: LWExpression
    private _cases: SwitchStatement['cases'] = []
    private _default: LWStatement[] = []
    /**
     * Set the selector expression using a deferred expression builder.
     * Returns an ExpressionBuilder for specifying the selector expression.
     *
     * @returns ExpressionBuilder for deferred selector specification
     */
    selector(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_selector'))
    }
    /**
     * Add multiple case clauses to the switch statement.
     *
     * @param cases - Array of case clauses (case expression and body statements)
     * @returns This builder for chaining
     */
    cases(cases: SwitchStatement['cases']) { this._cases.push(...cases); return this }
    /**
     * Start a new case clause with the given value.
     * Returns a CaseBuilder for adding body statements and optionally more case values.
     *
     * @param value - Case value (number, string, or ConstantExpression)
     * @returns CaseBuilder for building the case clause
     *
     * @example
     * ```typescript
     * Builders.switch()
     *   .selector().var('x').$()
     *   .case(0).call('handleZero').$().break()
     *   .case(1).case(2).call('handleSmall').$().$()
     *   .$()
     * ```
     */
    case(...values: (string | number | ConstantExpression)[]): BlockBuilder<this> {
        return new BlockBuilder(body => {
            this._cases.push({
                value: values.map(it => typeof it === 'object' ? it : E.c(it)),
                body
            })
            return this
        })
    }
    /**
     * Start a default clause.
     *
     * @returns CaseBuilder for building the default clause
     */
    default(): BlockBuilder<this> {
        return new BlockBuilder(body => {
            this._default.push(...body)
            return this
        })
    }
    /**
     * Finalize the builder and return the constructed switch statement.
     *
     * @returns The built SwitchStatement
     * @throws Error if selector is not specified
     */
    $(): P { return this._cont({
        kind: LWKind.SwitchStatement,
        selector: this._selector!,
        cases: this._cases,
        default: this._default
    }); }
}

class ThrowBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: ThrowStatement) => P) {}
    private _error?: LWExpression

    /**
     * Set the expression that is isued to throw.
     * Returns an ExpressionBuilder for specifying the selector expression.
     *
     * @returns ExpressionBuilder for deferred selector specification
     */
    error(error: LWExpression) { this._error = error; return this }

    err(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_error'))
    }

    /**
     * Finalize the builder and return the constructed throw statement.
     *
     * @returns The built ThrowStatement
     * @throws Error if error is not specified
     */
    $(): P {
        check("Throw", this._error)

        return this._cont({
            kind: LWKind.ThrowStatement,
            error: this._error!
        });
    }
}

/**
 * Builder for creating loop statements (for/while loops).
 *
 * @typeParam P - The type returned by the continuation function (usually LoopStatement or a parent builder)
 *
 * @example
 * ```typescript
 * // While loop
 * const whileLoop = Builders.loop()
 *   .cond(b => b.expr().binary('<').left('i').right(10).$())
 *   .body(b => b.expr().call('print').arg('i').$())
 *   .$();
 *
 * // For loop with init and step
 * const forLoop = Builders.loop()
 *   .init(b => b.decl('i', T.number(), true, 0).$())
 *   .cond(b => b.expr().binary('<').left('i').right(10).$())
 *   .step(b => b.expr().binary('+=').left('i').right(1).$())
 *   .body(b => b.expr().call('print').arg('i').$())
 *   .$();
 * ```
 */
class LoopBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: LoopStatement) => P) {}
    private _init?: LWStatement
    private _cond?: LWExpression
    private _step?: LWStatement
    private _body?: LWStatement
    /**
     * Set the loop condition expression directly.
     *
     * @param cond - Condition expression
     * @returns This builder for chaining
     */
    condition(cond: LWExpression) { this._cond = cond; return this }
    /**
     * Set the loop body statement directly.
     *
     * @param body - Loop body statement
     * @returns This builder for chaining
     */
    bodyStmt(body: LWStatement) { this._body = body; return this }
    /**
     * Set the initialization statement using a deferred statement builder.
     * Returns a StatementBuilder for specifying the initialization statement.
     *
     * @returns StatementBuilder for deferred initialization specification
     */
    init(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_init'))
    }
    /**
     * Set the loop condition expression using a deferred expression builder.
     * Returns an ExpressionBuilder for specifying the condition.
     *
     * @returns ExpressionBuilder for deferred condition specification
     */
    cond(): ExpressionBuilder<this> {
        return new ExpressionBuilder(saveInto(this, '_cond'))
    }
    /**
     * Set the step statement using a deferred statement builder.
     * Returns a StatementBuilder for specifying the step statement.
     *
     * @returns StatementBuilder for deferred step specification
     */
    step(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_step'))
    }
    /**
     * Set the loop body statement using a deferred statement builder.
     * Returns a StatementBuilder for specifying the loop body.
     *
     * @returns StatementBuilder for deferred body specification
     */
    body(): StatementBuilder<this> {
        return new StatementBuilder(saveInto(this, '_body'))
    }
    /**
     * Finalize the builder and return the constructed loop statement.
     *
     * @returns The built LoopStatement
     * @throws Error if condition or body is not specified
     */
    $(): P {
        check("Loop", this._cond, this._body)
        return this._cont(S.loop(this._cond!, this._body!, this._init, this._step))
    }
}

/**
 * Builder for creating any type of statement.
 * Provides factory methods for creating specific statement builders.
 *
 * @typeParam P - The type returned by the continuation function (usually LWStatement or a parent builder)
 *
 * @example
 * ```typescript
 * // Create a statement builder for a declaration
 * const stmt = Builders.stmt()
 *   .decl('x', T.number())
 *   .value(42)
 *   .$();
 *
 * // Create a statement builder for an if statement
 * const ifStmt = Builders.stmt()
 *   .if()
 *   .cond(b => b.expr().binary('>').left('x').right(0).$())
 *   .then(b => b.expr().call('print').arg('positive').$())
 *   .$();
 * ```
 */
class StatementBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement
     */
    constructor(private _cont: (stmt: LWStatement) => P) {}
    private _stmt?: LWStatement
    /**
     * Create a binary expression statement.
     * Returns a BinaryBuilder for specifying left and right operands.
     *
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     * @returns BinaryBuilder for deferred construction
     */
    binary(op: string): BinaryBuilder<StatementBuilder<P>> {
        return new BinaryBuilder(morphInto(this, '_stmt', S.e), op)
    }
    /**
     * Create a unary expression statement.
     * Returns a UnaryBuilder for specifying the operand.
     *
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     * @returns UnaryBuilder for deferred construction
     */
    unary(op: string): UnaryBuilder<StatementBuilder<P>> {
        return new UnaryBuilder(morphInto(this, '_stmt', S.e), op)
    }
    /**
     * Create a block/compound statement.
     * Returns a BlockBuilder for specifying multiple statements.
     *
     * @returns BlockBuilder for deferred construction
     */
    block(): BlockBuilder<StatementBuilder<P>> {
        return new BlockBuilder(morphInto(this, '_stmt', S.block))
    }
    /**
     * Create a function call statement.
     * Returns a CallBuilder for specifying function, receiver, and arguments.
     *
     * @param func - Optional function name or expression
     * @returns CallBuilder for deferred construction
     */
    call(func?: string | LWExpression): CallBuilder<StatementBuilder<P>> {
        return new CallBuilder(morphInto(this, '_stmt', S.e), func)
    }
    /**
     * Create a variable declaration statement.
     * Returns a DeclarationBuilder for specifying variable properties and initial value.
     *
     * @param name - Variable name
     * @param type - Optional variable type (defaults to auto)
     * @returns DeclarationBuilder for deferred construction
     */
    decl(name: string, type?: LWType): DeclarationBuilder<StatementBuilder<P>> {
        return new DeclarationBuilder(morphInto(this, '_stmt', id), name, type)
    }
    /**
     * Create an if statement.
     * Returns an IfBuilder for specifying condition and branches.
     *
     * @returns IfBuilder for deferred construction
     */
    if(): IfBuilder<StatementBuilder<P>> {
        return new IfBuilder(morphInto(this, '_stmt', id))
    }
    /**
     * Create a switch statement.
     * Returns a SwitchBuilder for specifying selector, cases, and default clause.
     *
     * @returns SwitchBuilder for deferred construction
     */
    switch(): SwitchBuilder<StatementBuilder<P>> {
        return new SwitchBuilder(morphInto(this, '_stmt', id))
    }
    /**
     * Create a loop statement.
     * Returns a LoopBuilder for specifying initialization, condition, step, and body.
     *
     * @returns LoopBuilder for deferred construction
     */
    loop(): LoopBuilder<StatementBuilder<P>> {
        return new LoopBuilder(morphInto(this, '_stmt', id))
    }
    /**
     * Create a return statement or expression statement based on return type.
     * Returns a ReturnBuilder for specifying the return value.
     *
     * @param type - Optional return type (void for expression statements)
     * @returns ReturnBuilder for deferred construction
     */
    return(type?: LWType): ReturnBuilder<StatementBuilder<P>> {
        return new ReturnBuilder(morphInto(this, '_stmt', id), type)
    }
    /**
     * Create none statement.
     * Returns an NoneBuilder for specifying condition and branches.
     *
     * @returns NoneBuilder for deferred construction
     */
    none(): NoneBuilder<StatementBuilder<P>> {
        return new NoneBuilder(morphInto(this, '_stmt', id))
    }
    /**
     * Finalize the builder and return the constructed statement.
     *
     * @returns The built statement
     * @throws Error if no statement has been specified
     */
    $(): P {
        check("Statement", this._stmt)
        return this._cont(this._stmt!)
    }
}

/**
 * Builder for creating block/compound statements (sequences of statements).
 *
 * @typeParam P - The type returned by the continuation function (usually LWStatement[] or a parent builder)
 *
 * @example
 * ```typescript
 * // Create a block with multiple statements
 * const block = Builders.block()
 *   .statements([
 *     S.declaration('x', T.number(), true, 1),
 *     S.declaration('y', T.number(), true, 2)
 *   ])
 *   .$();
 *
 * // Create a block using builder methods
 * const block2 = Builders.block()
 *   .decl('x', T.number()).value(1).$()
 *   .decl('y', T.number()).value(2).$()
 *   .$();
 * ```
 */
class BlockBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built statement array
     */
    constructor(private _cont: (stmts: LWStatement[]) => P) {}
    protected _body: LWStatement[] = []
    /**
     * Add multiple statements to the block.
     *
     * @param stmts - Array of statements to add
     * @returns This builder for chaining
     */
    statements(stmts: LWStatement[]) { this._body.push(...stmts); return this }
    /**
     * Create a binary expression statement and add it to the block.
     * Returns a BinaryBuilder for specifying left and right operands.
     *
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     * @returns BinaryBuilder for deferred construction
     */
    binary(op: string): BinaryBuilder<BlockBuilder<P>> {
        return new BinaryBuilder(stmt => {
            this._body.push(S.e(stmt))
            return this
        }, op)
    }
    /**
     * Create a unary expression statement and add it to the block.
     * Returns a UnaryBuilder for specifying the operand.
     *
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     * @returns UnaryBuilder for deferred construction
     */
    unary(op: string): UnaryBuilder<BlockBuilder<P>> {
        return new UnaryBuilder(stmt => {
            this._body.push(S.e(stmt))
            return this
        }, op)
    }
    /**
     * Create a nested block statement and add it to the block.
     * Returns a BlockBuilder for specifying the nested block's statements.
     *
     * @returns BlockBuilder for deferred construction
     */
    block(): BlockBuilder<BlockBuilder<P>> {
        return new BlockBuilder(stmts => {
            this._body.push(S.block(stmts))
            return this
        })
    }
    /**
     * Create a function call statement and add it to the block.
     * Returns a CallBuilder for specifying function, receiver, and arguments.
     *
     * @param func - Optional function name or expression
     * @returns CallBuilder for deferred construction
     */
    call(func?: string | LWExpression): CallBuilder<BlockBuilder<P>> {
        return new CallBuilder(stmt => {
            this._body.push(S.e(stmt))
            return this
        }, func)
    }
    /**
     * Create a variable declaration statement and add it to the block.
     * Returns a DeclarationBuilder for specifying variable properties and initial value.
     *
     * @param name - Variable name
     * @param type - Optional variable type (defaults to auto)
     * @returns DeclarationBuilder for deferred construction
     */
    decl(name: string, type?: LWType): DeclarationBuilder<BlockBuilder<P>> {
        return new DeclarationBuilder(stmt => {
            this._body.push(stmt)
            return this
        }, name, type)
    }
    /**
     * Create an if statement and add it to the block.
     * Returns an IfBuilder for specifying condition and branches.
     *
     * @returns IfBuilder for deferred construction
     */
    if(): IfBuilder<BlockBuilder<P>> {
        return new IfBuilder(stmt => {
            this._body.push(stmt)
            return this
        })
    }
    /**
     * Create a switch statement and add it to the block.
     * Returns a SwitchBuilder for specifying selector, cases, and default clause.
     *
     * @returns SwitchBuilder for deferred construction
     */
    switch(): SwitchBuilder<BlockBuilder<P>> {
        return new SwitchBuilder(stmt => {
            this._body.push(stmt)
            return this
        })
    }
    /**
     * Create a loop statement and add it to the block.
     * Returns a LoopBuilder for specifying initialization, condition, step, and body.
     *
     * @returns LoopBuilder for deferred construction
     */
    loop(): LoopBuilder<BlockBuilder<P>> {
        return new LoopBuilder(stmt => {
            this._body.push(stmt)
            return this
        })
    }
    /**
     * Create a return statement or expression statement and add it to the block.
     * Returns a ReturnBuilder for specifying the return value.
     *
     * @param type - Optional return type (void for expression statements)
     * @returns ReturnBuilder for deferred construction
     */
    return(type?: LWType): ReturnBuilder<BlockBuilder<P>> {
        return new ReturnBuilder(stmt => {
            this._body.push(stmt)
            return this
        }, type)
    }
    /**
     * Add a break statement to the block.
     *
     * @returns This builder for chaining
     */
    break(): BlockBuilder<P> {
        this._body.push(S.break())
        return this
    }
    /**
     * Add a "throw new Error("Not implemented")" statement to the block.
     * Convenience method for stub/unimplemented method bodies.
     *
     * @returns This builder for chaining
     */
    unimplemented(): BlockBuilder<P> {
        this._body.push(S.e(E.v('throw new Error("Not implemented")')))
        return this
    }
    /**
     * Finalize the builder and return the constructed block statement.
     *
     * @returns The built block statement (array of statements)
     */
    $(): P {
        return this._cont(this._body)
    }
}

/**
 * Builder for creating function/parameter type pairs.
 * Used by LambdaBuilder, FunctionTypeBuilder, and FunctionBuilder for parameter specification.
 *
 * @typeParam P - The type returned by the continuation function (usually the parent builder)
 *
 * @example
 * ```typescript
 * // Used within a lambda builder
 * const lambda = Builders.lambda()
 *   .param('x').type(T.number())
 *   .param('y').type(T.string())
 *   .body(b => b.ret(b.expr().binary('+').left('x').right(1).$()))
 *   .$();
 * ```
 */
class ParamBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the parameter name and type
     * @param _name - Parameter name
     */
    constructor(
        private _cont: (name: string, type: LWType) => P,
        private _name: string
    ) {}
    private _type?: LWType
    /**
     * Set the parameter type directly.
     *
     * @param type - Parameter type, or type name
     * @returns This builder for chaining
     */
    type(type: LWType | string) { this._type = typeof type === 'string' ? T.c(type) : type; return this }
    /**
     * Finalize the builder and return the parameter to the parent builder.
     *
     * @returns The parent builder with the parameter added
     * @throws Error if parameter type is not specified
     */
    $(): P {
        check("Parameter", this._type)
        return this._cont(this._name, this._type!)
    }
}

/**
 * Builder for creating functional types (function signatures).
 *
 * @typeParam P - The type returned by the continuation function (usually FunctionalType or a parent builder)
 *
 * @example
 * ```typescript
 * // Create a function type (number, string) => boolean
 * const funcType = Builders.funcType()
 *   .param('x').type(T.number())
 *   .param('y').type(T.string())
 *   .returns(T.boolean())
 *   .$();
 * ```
 */
class FunctionTypeBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built functional type
     */
    constructor(private _cont: (type: FunctionalType) => P) {}
    private _parameters: {name: string, type: LWType}[] = []
    private _returnType?: LWType
    /**
     * Set the return type for the functional type.
     *
     * @param type - Return type
     * @returns This builder for chaining
     */
    returns(type: LWType) { this._returnType = type; return this }
    /**
     * Add multiple parameters to the functional type.
     *
     * @param params - Array of parameter name-type pairs
     * @returns This builder for chaining
     */
    parameters(params: {name: string, type: LWType}[]) { this._parameters.push(...params); return this }
    /**
     * Add a single parameter to the functional type using a parameter builder.
     * Returns a ParamBuilder for specifying the parameter type.
     *
     * @param name - Parameter name
     * @returns ParamBuilder for deferred parameter type specification
     */
    param(name: string): ParamBuilder<FunctionTypeBuilder<P>> {
        return new ParamBuilder((name, type) => {
            this._parameters.push({name, type})
            return this
        }, name)
    }
    /**
     * Finalize the builder and return the constructed functional type.
     *
     * @returns The built FunctionalType
     * @throws Error if return type is not specified
     */
    $(): P {
        check("FunctionType", this._returnType)
        return this._cont(T.fn(this._parameters, this._returnType!))
    }
}

/**
 * Builder for creating function declarations.
 *
 * @typeParam P - The type returned by the continuation function (usually FunctionDeclaration or a parent builder)
 *
 * @example
 * ```typescript
 * // Create a simple function
 * const func = Builders.func('add')
 *   .param('a').type(T.number())
 *   .param('b').type(T.number())
 *   .returns(T.number())
 *   .block(b => b
 *     .ret(b.expr().binary('+').left('a').right('b').$())
 *   )
 *   .$();
 *
 * // Create a native static function
 * const nativeFunc = Builders.func('nativeFunc')
 *   .native()
 *   .static()
 *   .returns(T.void())
 *   .$();
 * ```
 */
class FunctionBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the built function declaration
     * @param _name - Function name
     */
    constructor(
        private _cont: (decl: FunctionDeclaration) => P,
        private _name: string
    ) {}
    private _modifiers: Modifier[] = []
    private _parameters: FunctionDeclaration['parameters'] = []
    private _returnType?: LWType
    private _body?: LWStatement
    private _annotations: Annotation[] = []
    /**
     * Add native modifier to the function (indicates platform-native implementation).
     *
     * @returns This builder for chaining
     */
    native() { this._modifiers.push(Md.native()); return this }
    /**
     * Add static modifier to the function (class-level method).
     *
     * @returns This builder for chaining
     */
    static() { this._modifiers.push(Md.static()); return this }
    /**
     * Add private modifier to the function (private visibility).
     *
     * @returns This builder for chaining
     */
    private() { this._modifiers.push(Md.private()); return this }
    /**
     * Set the return type for the function.
     *
     * @param type - Return type
     * @returns This builder for chaining
     */
    returns(type: LWType) { this._returnType = type; return this }
    /**
     * Set the function body statement directly.
     *
     * @param body - Function body statement
     * @returns This builder for chaining
     */
    body(body: LWStatement) { this._body = body; return this }
    /**
     * Add multiple parameters to the function.
     *
     * @param params - Array of parameter descriptors (name and type)
     * @returns This builder for chaining
     */
    parameters(params: FunctionDeclaration['parameters']) { this._parameters.push(...params); return this }
    /**
     * Add a single parameter to the function using a parameter builder.
     * Returns a ParamBuilder for specifying the parameter type.
     *
     * @param name - Parameter name
     * @returns ParamBuilder for deferred parameter type specification
     */
    param(name: string): ParamBuilder<FunctionBuilder<P>> {
        return new ParamBuilder((name, type) => {
            this._parameters.push({name, type})
            return this
        }, name)
    }
    /**
     * Set the function body using a block builder.
     * Returns a BlockBuilder for specifying multiple statements as the function body.
     *
     * @returns BlockBuilder for deferred body specification
     */
    block(): BlockBuilder<FunctionBuilder<P>> {
        return new BlockBuilder(stmts => {
            this._body = S.block(stmts)
            return this
        })
    }
    /**
     * Add a simple annotation (decorator) to the function.
     *
     * @param name - Annotation name
     * @returns This builder for chaining
     */
    annotation(name: string) {
        const annotation: SimpleAnnotation = {
            kind: DecoratorKind.SimpleAnnotation,
            name,
        }
        this._annotations.push(annotation)
        return this
    }
    /**
     * Add a macro invocation annotation to the function.
     *
     * @param name - Macro name
     * @param args - Macro arguments (strings or types)
     * @returns This builder for chaining
     */
    macro(name: string, ...args: (string | LWExpression | LWType)[]) {
        const annotation: MacroInvocation = {
            kind: DecoratorKind.MacroInvocation,
            name,
            args,
        }
        this._annotations.push(annotation)
        return this
    }
    /**
     * Finalize the builder and return the constructed function declaration.
     * If return type is not specified, defaults to void.
     *
     * @returns The built FunctionDeclaration
     */
    $(): P {
        return this._cont(
            DD({generics: [], modifiers: this._modifiers})
                .func(this._name, this._parameters,
                    this._returnType ?? Ts.prim.void,
                    this._body, this._annotations))
    }
}

/**
 * Builder for creating field declarations (structure/class members).
 *
 * @typeParam P - The type returned by the continuation function (usually the parent builder)
 *
 * @example
 * ```typescript
 * // Create a field with modifiers
 * const field = Builders.field('name')
 *   .type(T.string())
 *   .static()
 *   .optional()
 *   .$();
 *
 * // Create a field with function type
 * const callbackField = Builders.field('onClick')
 *   .funcType()
 *   .param('event').type(T.string())
 *   .returns(T.void())
 *   .$()
 *   .$();
 * ```
 */
class FieldBuilder<P> {
    /**
     * @param _cont - Continuation function that receives the field name, type, modifiers, and optional expression
     * @param _name - Field name
     */
    constructor(
        private _cont: (name: string, type: LWType, modifiers?: Modifier[], expression?: LWExpression) => P,
        private _name: string
    ) {}
    private _type?: LWType
    private _value?: LWExpression
    private _modifiers: Modifier[] = []
    /**
     * Add static modifier to the field (class-level member).
     *
     * @returns This builder for chaining
     */
    static() { this._modifiers.push(Md.static()); return this }
    /**
     * Add optional modifier to the field (optional member).
     *
     * @returns This builder for chaining
     */
    optional() { this._modifiers.push(Md.optional()); return this }
    /**
     * Add readonly modifier to the field (immutable member).
     *
     * @returns This builder for chaining
     */
    readonly() { this._modifiers.push(Md.readonly()); return this }
    /**
     * Add multiple modifiers to the field.
     *
     * @param modifiers - Array of modifiers to add
     * @returns This builder for chaining
     */
    modifiers(modifiers: Modifier[]) { this._modifiers.push(...modifiers); return this }
    /**
     * Set the field type directly.
     *
     * @param type - Field type
     * @returns This builder for chaining
     */
    type(type: LWType) { this._type = type; return this }
    /**
     * Set the field type using a function type builder.
     * Returns a FunctionTypeBuilder for specifying a functional type.
     *
     * @returns FunctionTypeBuilder for deferred functional type specification
     */
    funcType(): FunctionTypeBuilder<this> {
        return new FunctionTypeBuilder(type => {
            this._type = type
            return this
        })
    }
    value(value: ExpressionLike): this
    value(): ExpressionBuilder<this>
    value(value?: ExpressionLike): this | ExpressionBuilder<this> {
        return assign(this, '_value', value)
    }
    /**
     * Finalize the builder and return the field to the parent builder.
     *
     * @returns The parent builder with the field added
     * @throws Error if field name or type is not specified
     */
    $(): P {
        check("Field", this._name, this._type)
        return this._cont(this._name!, this._type!, this._modifiers, this._value)
    }
}

/**
 * Base builder for structure-like declarations (structs and classes).
 * Provides common field management functionality.
 *
 * @example
 * ```typescript
 * // Used by StructBuilder and ClassBuilder
 * const struct = Builders.struct('Point')
 *   .field('x').type(T.number())
 *   .field('y').type(T.number())
 *   .$();
 * ```
 */
class StructLikeBuilder {
    /**
     * @param _name - Structure name
     */
    constructor(protected _name: string) {}
    protected _fields: ClassDeclaration['fields'] = []
    fields(fields: ClassDeclaration['fields']) { this._fields.push(...fields); return this }
    /**
     * Add a field to the structure.
     * Returns a FieldBuilder for specifying field type and modifiers.
     *
     * @param name - Field name
     * @returns FieldBuilder for deferred field specification
     */
    field(name: string): FieldBuilder<this> {
        return new FieldBuilder((name, type, modifiers, expression) => {
            this._fields.push({name, type, modifiers, expression})
            return this
        }, name)
    }
}

/**
 * Builder for creating structure declarations.
 *
 * @example
 * ```typescript
 * const struct = Builders.struct('Point')
 *   .field('x').type(T.number())
 *   .field('y').type(T.number())
 *   .$();
 * ```
 */
class StructBuilder extends StructLikeBuilder {
    /**
     * Finalize the builder and return the constructed structure declaration.
     *
     * @returns The built StructureDeclaration
     * @throws Error if structure name is not specified
     */
    $(): StructureDeclaration {
        check("Struct", this._name)
        return D.struct(this._name, this._fields)
    }
}

/**
 * Builder for creating class declarations (including interfaces).
 *
 * @example
 * ```typescript
 * const class = Builders.class('Person')
 *   .field('name').type(T.string())
 *   .field('age').type(T.number())
 *   .method('greet')
 *     .returns(T.string())
 *     .body(b => b.ret(b.expr().string('Hello')))
 *     .$()
 *   .$();
 *
 * // Create an interface
 * const interface = Builders.class('Drawable')
 *   .kind('interface')
 *   .method('draw')
 *     .returns(T.void())
 *     .$()
 *   .$();
 * ```
 */
class ClassBuilder extends StructLikeBuilder {
    private _methods: FunctionDeclaration[] = []
    private _oop: ClassDeclaration['oop'] = {
        kind: 'class',
        base: undefined,
        implementations: []
    }
    methods(methods: FunctionDeclaration[]) { this._methods.push(...methods); return this }
    /**
     * Specify the base class that this class extends (inherits from).
     *
     * @param type - Base class type (e.g., `T.value('BaseClass')`)
     * @returns This builder for chaining
     *
     * @example
     * ```typescript
     * Builders.class('Derived')
     *   .extends(T.value('BaseClass'))
     *   .field('x', T.number())
     *   .$();
     * ```
     */
    extends(type: LWType | undefined) { this._oop!.base = type; return this }
    /**
     * Add an interface that this class implements.
     * Can be called multiple times to implement multiple interfaces.
     *
     * @param type - Interface type (e.g., `T.value('Serializable')`)
     * @returns This builder for chaining
     *
     * @example
     * ```typescript
     * Builders.class('MyClass')
     *   .implements(T.value('Serializable'))
     *   .implements(T.value('Cloneable'))
     *   .field('data', T.string())
     *   .$();
     * ```
     */
    implements(type: LWType) { this._oop!.implementations?.push(type); return this }
    /**
     * Mark this declaration as an interface rather than a class.
     * When called, the builder will produce an interface declaration.
     *
     * @returns This builder for chaining
     *
     * @example
     * ```typescript
     * Builders.class('Drawable')
     *   .kind('interface')
     *   .method('draw')
     *     .returns(T.void())
     *     .$()
     *   .$();
     * ```
     */
    kind(kind: 'class' | 'interface') { this._oop!.kind = kind; return this }
    /**
     * Add a method to the class/interface.
     * Returns a FunctionBuilder for defining the method's signature and body.
     *
     * @param name - Method name
     * @returns FunctionBuilder for defining the method
     *
     * @example
     * ```typescript
     * Builders.class('Calculator')
     *   .method('add')
     *     .param('a', T.number())
     *     .param('b', T.number())
     *     .returns(T.number())
     *     .body(b => b.ret(b.expr().binary('+').left('a').right('b').$()))
     *     .$()
     *   .$();
     * ```
     */
    method(name: string): FunctionBuilder<ClassBuilder> {
        return new FunctionBuilder(func => {
            this._methods.push(func)
            return this
        }, name)
    }
    /**
     * Add a constructor to the class.
     * Returns a FunctionBuilder for defining the constructor's parameters and body.
     * The constructor name is automatically set to the standard constructor name.
     *
     * @returns FunctionBuilder for defining the constructor
     *
     * @example
     * ```typescript
     * Builders.class('Person')
     *   .field('name', T.string())
     *   .ctor()
     *     .param('name', T.string())
     *     .body(b => b.assign(b.access('name').receiver('this').$(), 'name'))
     *     .$()
     *   .$();
     * ```
     */
    ctor(): FunctionBuilder<ClassBuilder> {
        return this.method(std.names.members.ctor)
    }
    /**
     * Finalize the class/interface builder and produce a ClassDeclaration node.
     * Validates that required fields (name) are set.
     *
     * @returns Completed ClassDeclaration AST node
     *
     * @example
     * ```typescript
     * const classDecl = Builders.class('Person')
     *   .field('name', T.string())
     *   .method('greet')
     *     .returns(T.string())
     *     .body(b => b.ret(b.expr().string('Hello')))
     *     .$()
     *   .$();
     * ```
     */
    $(): ClassDeclaration {
        check("Class", this._name)
        return D.class(this._name!, this._fields, this._methods, this._oop)
    }
}

/**
 * Builder for creating enum declarations.
 *
 * @example
 * ```typescript
 * const enumDecl = Builders.enum('Color')
 *   .member('Red', 0)
 *   .member('Green', 1)
 *   .member('Blue', 2)
 *   .$();
 *
 * // With string values
 * const statusEnum = Builders.enum('Status')
 *   .member('Active', 'ACTIVE')
 *   .member('Inactive', 'INACTIVE')
 *   .$();
 * ```
 */
class EnumBuilder {
    constructor(private _name: string) {}
    private _members: EnumDeclaration['members'] = []
    /**
     * Add a single member to the enum.
     *
     * @param name - Member name
     * @param value - Optional numeric or string value (auto-assigned if omitted)
     * @returns This builder for chaining
     *
     * @example
     * ```typescript
     * Builders.enum('Color')
     *   .member('Red', 0)
     *   .member('Green', 1)
     *   .$();
     * ```
     */
    member(name: string, value?: number | string) { this._members.push({name, value}); return this }
    /**
     * Add multiple members to the enum at once.
     *
     * @param members - Array of enum member descriptors (name and optional value)
     * @returns This builder for chaining
     *
     * @example
     * ```typescript
     * Builders.enum('Direction')
     *   .members([
     *     { name: 'North', value: 0 },
     *     { name: 'South', value: 1 },
     *     { name: 'East', value: 2 },
     *     { name: 'West', value: 3 }
     *   ])
     *   .$();
     * ```
     */
    members(members: EnumDeclaration['members']) { this._members.push(...members); return this; }
    /**
     * Finalize the enum builder and produce an EnumDeclaration node.
     *
     * @returns Completed EnumDeclaration AST node
     *
     * @example
     * ```typescript
     * const enumDecl = Builders.enum('Status')
     *   .member('Pending', 0)
     *   .member('Active', 1)
     *   .member('Completed', 2)
     *   .$();
     * ```
     */
    $(): EnumDeclaration {
        return D.enum(this._name, this._members)
    }
}

/**
 * Builder for creating type alias (typedef) declarations.
 * Currently supports only functional type aliases (function signatures).
 *
 * @example
 * ```typescript
 * const typeAlias = Builders.type('StringOrNumber')
 *   .funcType()
 *     .param('x', T.string())
 *     .returns(T.number())
 *     .$()
 *   .$();
 * ```
 */
class TypedefBuilder {
    constructor(private _name: string) {}
    private _type?: LWType
    /**
     * Define a functional type alias (function signature).
     * Returns a FunctionTypeBuilder for defining the function signature.
     * Currently only functional type aliases are supported.
     *
     * @returns FunctionTypeBuilder for defining the function signature
     *
     * @example
     * ```typescript
     * Builders.type('StringTransformer')
     *   .funcType()
     *     .param('input', T.string())
     *     .returns(T.string())
     *     .$()
     *   .$();
     * ```
     */
    funcType(): FunctionTypeBuilder<TypedefBuilder> {
        return new FunctionTypeBuilder(type => {
            this._type = type
            return this
        })
    }
    /**
     * Finalize the type alias builder and produce a TypedefDeclaration node.
     * Validates that the type is defined.
     *
     * @returns Completed TypedefDeclaration AST node
     *
     * @example
     * ```typescript
     * const typeAlias = Builders.type('Callback')
     *   .funcType()
     *     .param('data', T.string())
     *     .returns(T.void())
     *     .$()
     *   .$();
     * ```
     */
    $(): TypedefDeclaration {
        check("Type", this._type)
        return D.type(this._name, this._type!)
    }
}

/**
 * Main fluent builder factory class.
 *
 * Provides static factory methods for creating builders for all types of AST nodes.
 * Each method returns a builder instance that supports method chaining and
 * partial construction, finalized with a `$()` method.
 *
 * @example
 * ```typescript
 * // Create an expression builder
 * const exprBuilder = Builders.expr();
 *
 * // Create a function builder
 * const funcBuilder = Builders.func('myFunction');
 *
 * // Create a class builder
 * const classBuilder = Builders.class('MyClass');
 * ```
 */
export class Builders {
    /**
     * Create an expression builder.
     *
     * @returns ExpressionBuilder for creating any type of expression
     *
     * @example
     * ```typescript
     * const expr = Builders.expr()
     *   .binary('+')
     *   .left(1)
     *   .right(2)
     *   .$();
     * ```
     */
    static expr(): ExpressionBuilder<LWExpression> { return new ExpressionBuilder(id) }
    /**
     * Create a statement builder.
     *
     * @returns StatementBuilder for creating any type of statement
     *
     * @example
     * ```typescript
     * const stmt = Builders.stmt()
     *   .decl('x', T.number(), true, 42)
     *   .$();
     * ```
     */
    static stmt(): StatementBuilder<LWStatement> { return new StatementBuilder(id) }
    /**
     * Create a function builder.
     *
     * @param name - Function name
     * @returns FunctionBuilder for creating a function declaration
     *
     * @example
     * ```typescript
     * const func = Builders.func('add')
     *   .param('a', T.number())
     *   .param('b', T.number())
     *   .returns(T.number())
     *   .body(b => b.ret(b.expr().binary('+').left('a').right('b').$()))
     *   .$();
     * ```
     */
    static func(name: string): FunctionBuilder<FunctionDeclaration> { return new FunctionBuilder(id, name) }
    /**
     * Create a field builder for standalone field construction.
     *
     * @param name - Field name
     * @returns FieldBuilder for creating a field declaration (as used in ClassDeclaration.fields)
     *
     * @example
     * ```typescript
     * const field = Builders.field('count')
     *   .type(Ts.prim.number)
     *   .value(0)
     *   .$();
     * // { name: 'count', type: ..., modifiers: [], expression: ... }
     * ```
     */
    static field(name: string): FieldBuilder<ClassDeclaration['fields'][number]> {
        return new FieldBuilder((name, type, modifiers, expression) => ({name, type, modifiers, expression}), name)
    }
    /**
     * Create a structure builder.
     *
     * @param name - Structure name
     * @returns StructBuilder for creating a structure declaration
     *
     * @example
     * ```typescript
     * const struct = Builders.struct('Point')
     *   .field('x', T.number())
     *   .field('y', T.number())
     *   .$();
     * ```
     */
    static struct(name: string): StructBuilder { return new StructBuilder(name) }
    /**
     * Create a class builder.
     *
     * @param name - Class name
     * @returns ClassBuilder for creating a class declaration
     *
     * @example
     * ```typescript
     * const class = Builders.class('Person')
     *   .field('name', T.string())
     *   .field('age', T.number())
     *   .method('greet')
     *     .returns(T.string())
     *     .body(b => b.ret(b.expr().string('Hello')))
     *     .$()
     *   .$();
     * ```
     */
    static class(name: string): ClassBuilder { return new ClassBuilder(name) }
    /**
     * Create an enum builder.
     *
     * @param name - Enum name
     * @returns EnumBuilder for creating an enum declaration
     *
     * @example
     * ```typescript
     * const enum = Builders.enum('Color')
     *   .member('Red', 0)
     *   .member('Green', 1)
     *   .member('Blue', 2)
     *   .$();
     * ```
     */
    static enum(name: string): EnumBuilder { return new EnumBuilder(name) }
    /**
     * Create a type alias builder.
     *
     * @param name - Type alias name
     * @returns TypedefBuilder for creating a type alias declaration
     *
     * @example
     * ```typescript
     * const type = Builders.type('StringOrNumber')
     *   .funcType()
     *     .param('x', T.string())
     *     .returns(T.number())
     *     .$()
     *   .$();
     * ```
     */
    static type(name: string): TypedefBuilder { return new TypedefBuilder(name) }

    /**
     * Create an accessor expression builder.
     *
     * @param accessor - Optional property name or index expression
     * @returns AccessorBuilder for creating a property/member access expression
     *
     * @example
     * ```typescript
     * // obj.property
     * const accessor = Builders.access('property')
     *   .receiver('obj')
     *   .$();
     *
     * // array[index]
     * const indexAccess = Builders.access()
     *   .receiver('array')
     *   .index('index')
     *   .$();
     * ```
     */
    static access(accessor?: string | LWExpression): AccessorBuilder<AccessorExpression> { return new AccessorBuilder(id, accessor) }
    /**
     * Create a binary expression builder.
     *
     * @param op - Binary operator (e.g., '+', '-', '*', '/', '&&', '||', '==', '<')
     * @returns BinaryBuilder for creating a binary operation expression
     *
     * @example
     * ```typescript
     * // x + y
     * const binary = Builders.binary('+')
     *   .left('x')
     *   .right('y')
     *   .$();
     * ```
     */
    static binary(op: string): BinaryBuilder<BinaryExpression> { return new BinaryBuilder(id, op) }
    /**
     * Create a unary expression builder.
     *
     * @param op - Unary operator (e.g., '-', '!', '~', '++', '--')
     * @returns UnaryBuilder for creating a unary operation expression
     *
     * @example
     * ```typescript
     * // -x
     * const unary = Builders.unary('-')
     *   .value('x')
     *   .$();
     * ```
     */
    static unary(op: string): UnaryBuilder<UnaryExpression> { return new UnaryBuilder(id, op) }
    /**
     * Create a function call expression builder.
     *
     * @param func - Optional function name or expression
     * @returns CallBuilder for creating a function call expression
     *
     * @example
     * ```typescript
     * // add(1, 2)
     * const call = Builders.call('add')
     *   .arg(1)
     *   .arg(2)
     *   .$();
     *
     * // Math.max(x, y)
     * const methodCall = Builders.call('max')
     *   .receiver('Math')
     *   .arg('x')
     *   .arg('y')
     *   .$();
     * ```
     */
    static call(func?: string | LWExpression): CallBuilder<CallExpression> { return new CallBuilder(id, func) }
    /**
     * Create a constructor expression builder.
     *
     * @param name - Optional type/class name
     * @returns ConstructorBuilder for creating a constructor expression (new)
     *
     * @example
     * ```typescript
     * // new Date()
     * const ctor = Builders.ctor('Date')
     *   .$();
     *
     * // new Array<number>(10)
     * const arrayCtor = Builders.ctor('Array')
     *   .typeArg(T.number())
     *   .arg(10)
     *   .$();
     * ```
     */
    static ctor(name?: string): ConstructorBuilder<ConstructorExpression> { return new ConstructorBuilder(id, name) }
    static cast(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'cast', type) }
    static instanceof(type: LWType): CheckCastBuilder<CheckCastExpression> { return new CheckCastBuilder(id, 'instanceof', type) }
    static lambda(): LambdaBuilder<LambdaExpression> { return new LambdaBuilder(id) }

    static block(): BlockBuilder<LWStatement> { return new BlockBuilder(S.block) }
    static decl(name: string, type?: LWType): DeclarationBuilder<DeclarationStatement> { return new DeclarationBuilder(id, name, type) }
    static if(): IfBuilder<IfStatement> { return new IfBuilder(id) }
    static switch(): SwitchBuilder<SwitchStatement> { return new SwitchBuilder(id) }
    static throw(): ThrowBuilder<ThrowStatement> { return new ThrowBuilder(id) }
    static loop(): LoopBuilder<LoopStatement> { return new LoopBuilder(id) }
    static return(type?: LWType): ReturnBuilder<LWStatement> { return new ReturnBuilder(id, type) }
    static none(): NoneBuilder<LWStatement> { return new NoneBuilder(id) }
}
