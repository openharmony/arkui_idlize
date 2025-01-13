import * as idl from '@idlize/core/idl'
import * as ts from "typescript"
import { identName } from '@idlize/core'

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
        "AccelerationOptions",
        "EmitterOptions",
        "DataAddOperation",
        "DataChangeOperation",
        "DataReloadOperation",
        "ForEachInterface",
        "ForEachAttribute",
        "LazyForEachAttribute",
        "LazyForEachInterface",
        "IDataSource",
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
        "LocalizedPadding",
        "ColumnOptionsV2",
        "RowOptionsV2",
    )

    static readonly ConflictingDeclarationNames = [
        "TextStyle",
        "LinearGradient"
    ]

    static readonly ReplacedDeclarations = new Map<string, idl.IDLEntry>([
        ["CustomBuilder", idl.createCallback("CustomBuilder", [], idl.IDLVoidType)],
    ])

    static customSerializePropertyType(property: ts.MethodDeclaration | ts.MethodSignature, propertyName: string): idl.IDLType | undefined {
        if (!ts.isClassDeclaration(property.parent)) return

        switch (identName(property.parent.name)) {
            case "ScrollableCommonMethod":
            case "ScrollAttribute": {
                switch (propertyName) {
                    case "onWillScroll":
                    case "onDidScroll": {
                        return idl.createOptionalType(idl.createReferenceType("ScrollOnWillScrollCallback"))
                    }
                    case "onScroll": {
                        return idl.createReferenceType("Callback_Number_ScrollState_Void")
                    }
                    case "onScrollStart":
                    case "onScrollStop": {
                        return idl.createReferenceType("Callback_Void")
                    }
                }
                break
            }
            case "CommonMethod":
            case "FormComponentAttribute": {
                switch (propertyName) {
                    case "size": {
                        return idl.createReferenceType("SizeOptions")
                    }
                    break
                }
            }
        }
    }
}