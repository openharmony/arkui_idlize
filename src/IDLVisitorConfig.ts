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
}