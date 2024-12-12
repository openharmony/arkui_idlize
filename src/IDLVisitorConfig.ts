import * as idl from './idl'

export class IDLVisitorConfig {
    private constructor() {}

    static readonly DeletedDeclarations = new Array<string>(
        "WrappedBuilder",
        "wrapBuilder",
        "IMonitorValue",
        "IMonitor",
        "MethodDecorator",
        "ParticleInterface",
        "ParticleAttribute",
        "ParticleModifier",
        "Particles",
        "ParticleColorPropertyOptions",
        "ParticlePropertyOptions",
        "AccelerationOptions",
        "ParticleOptions",
        "EmitterOptions",
        "DataAddOperation",
        "DataChangeListener",
        "DataChangeOperation",
        "DataReloadOperation",
        "ForEachInterface",
        "ForEachAttribute",
        "LazyForEachAttribute",
        "DisturbanceFieldOptions",
        "RepeatItem",
        "RepeatItemBuilder",
        "RepeatAttribute",
        "TemplateTypedFunc",
        "PageTransitionEnterInterface",
        "PageTransitionExitInterface"
    )

    static readonly StubbedDeclarations = new Array<string>(
        "OnWillScrollCallback",
        "ContentModifier",
        "LayoutChild",
        "EmitterProperty",
        "DataOperation",
        "Layoutable",
        "GestureGroupGestureHandlerOptions",
    )

    static readonly ConflictingDeclarationNames = [
        "TextStyle",
        "LinearGradient"
    ]

    static readonly ReplacedDeclarations = new Map<string, idl.IDLEntry>([
        ["CustomBuilder", idl.createCallback("CustomBuilder", [], idl.IDLVoidType)],
    ])
}