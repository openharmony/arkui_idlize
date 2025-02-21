import * as idl from '@idlizer/core/idl'
import * as ts from "typescript"
import * as path from "path"
import { identName } from '@idlizer/core'

// convenience shorthands for IDL creation
namespace $ {
    export const bool = idl.IDLBooleanType
    export const num = idl.IDLNumberType
    export const f32 = idl.IDLF32Type
    export const str = idl.IDLStringType
    export const ref = idl.createReferenceType
    export const union = (...types: idl.IDLType[]) => idl.createUnionType(types)
    export const sequence = (...types: idl.IDLType[]) => idl.createContainerType("sequence", types)
    export const parameter = idl.createParameter
    export const callback = idl.createCallback
    export const optional = idl.createOptionalType
    export const tuple = (name: string, types: idl.IDLType[]) => {
        return idl.createInterface(
            name, idl.IDLInterfaceSubkind.Tuple, [], [], [],
            types.map((type, index) => idl.createProperty(`value${index}`, type)),
            [], [], [],
            {
                extendedAttributes: [
                    { name: idl.IDLExtendedAttributes.Synthetic },
                    { name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Tuple },
                ],
                fileName: "IDLVisitorConfig.ts",
            }
        )
    }
}

function radiusParameterType(): idl.IDLType {
    return $.union(
        $.num,
        $.str,
        $.sequence($.union($.num, $.str)),
    )
}

function onItemDragStartParameterType(): [idl.IDLType, idl.IDLEntry] {
    //(event: ItemDragInfo, itemIndex: number) => CustomBuilder
    const callback = $.callback(
        "Callback_ItemDragInfo_Number_CustomBuilder",
        [
            $.parameter("event", $.ref("ItemDragInfo")),
            $.parameter("itemIndex", $.num),
        ],
        $.ref("CustomBuilder"),
        { fileName: "IDLVisitorConfig.ts" },
    )
    return [$.ref(callback.name), callback]
}

function styledStringValueType(): idl.IDLType {
    // declare type StyledStringValue = TextStyle | DecorationStyle | BaselineOffsetStyle | LetterSpacingStyle |
    // TextShadowStyle | GestureStyle | ImageAttachment | ParagraphStyle | LineHeightStyle | UrlStyle | CustomSpan |
    // UserDataSpan | BackgroundColorStyle;
    return $.union(
        $.ref("TextStyle_styled_string"),
        $.ref("DecorationStyle"),
        $.ref("BaselineOffsetStyle"),
        $.ref("LetterSpacingStyle"),
        $.ref("TextShadowStyle"),
        $.ref("GestureStyle"),
        $.ref("ImageAttachment"),
        $.ref("ParagraphStyle"),
        $.ref("LineHeightStyle"),
        $.ref("UrlStyle"),
        $.ref("CustomSpan"),
        $.ref("UserDataSpan"),
        $.ref("BackgroundColorStyle"),
    )
}

const propertyTypeReplacements: ((clazz: string, property: string) => [idl.IDLType, idl.IDLEntry?] | undefined )[] = [
    (clazz, property) => {
        if (clazz === "Resource" && property === "params")
            return [$.sequence($.str)]
    },
    (clazz, property) => {
        if (clazz === "RectOptions" && property === "radius")
            return [radiusParameterType()]
    },
    (clazz, property) => {
        if (clazz === "PluginComponentOptions" && property === "data")
            return [$.str]
    },
    (clazz, property) => {
        if (clazz === "SliderBlockStyle" && property === "shape")
            return [$.str]
    },
    (clazz, property) => {
        if (clazz === "AlertDialogParam" && property === "textStyle")
            return [$.ref("TextStyle_alert_dialog")]
    },
    (clazz, property) => {
        if (clazz === "BorderImageOption" && property === "source")
            return [$.union($.str, $.ref("Resource"), $.ref("LinearGradient_common"))]
    },
    (clazz, property) => {
        let props = ["scale", "hoverScale"]
        if (clazz === "ContextMenuAnimationOptions" && props.includes(property))
            return [$.ref("AnimationRange_Number"), $.tuple("AnimationRange_Number", [$.num, $.num])]
    },
]

const parameterTypeReplacements: ((clazz: string, method: string, parameter: string) => [idl.IDLType, idl.IDLEntry?] | undefined )[] = [
    (clazz, method, parameter) => {
        if (clazz === "AnimatorAttribute" && method === "motion" && parameter === "value")
            return [$.ref("SpringMotion")]
    },

    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onWillScroll" && parameter === "handler")
            return [$.optional($.ref("ScrollOnWillScrollCallback"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onDidScroll" && parameter === "handler")
            return [$.ref("ScrollOnScrollCallback")]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onScroll" && parameter === "event")
            return [$.ref("Callback_Number_Number_Void")]
    },

    (clazz, method, parameter) => {
        if (clazz === "ScrollAttribute" && method === "onWillScroll" && parameter === "handler")
            return [$.optional($.ref("ScrollOnWillScrollCallback"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollAttribute" && method === "onDidScroll" && parameter === "handler")
            return [$.ref("ScrollOnScrollCallback")]
    },

    (clazz, method, parameter) => {
        if (clazz === "CommonMethod" && method === "size" && parameter === "value")
            return [$.ref("SizeOptions")]
    },
    (clazz, method, parameter) => {
        if (clazz === "CommonMethod" && method === "clip" && (parameter === "value" || parameter === "clip"))
            return [$.optional($.bool)]
    },
    (clazz, method, parameter) => {
        if (clazz === "CommonMethod" && method === "mask" && (parameter === "value" || parameter === "mask"))
            return [$.optional($.ref("ProgressMask"))]
    },

    (clazz, method, parameter) => {
        if (clazz === "FormComponentAttribute" && method === "size" && parameter === "value")
            return [$.ref("SizeOptions")]
    },

    (clazz, method, parameter) => {
        if (clazz === "LineAttribute" && method === "startPoint" && parameter === "value")
            return [$.sequence($.ref("Length"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "LineAttribute" && method === "endPoint" && parameter === "value")
            return [$.sequence($.ref("Length"))]
    },

    (clazz, method, parameter) => {
        if (clazz === "PolygonAttribute" && method === "points" && parameter === "value")
            return [$.sequence($.ref("Point"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "PolylineAttribute" && method === "points" && parameter === "value")
            return [$.sequence($.ref("Point"))]
    },

    (clazz, method, parameter) => {
        if (clazz === "RectAttribute" && method === "radius" && parameter === "value")
            return [radiusParameterType()]
    },

    (clazz, method, parameter) => {
        let classes = ["CanvasRenderingContext2D", "OffscreenCanvasRenderingContext2D"]
        if (classes.includes(clazz) && method === "toDataURL" && parameter === "quality")
            return [$.f32]
    },

    (clazz, method, parameter) => {
        if (clazz === "CommonShapeMethod" && method === "strokeDashArray" && parameter === "value")
            return [$.sequence($.ref("Length"))]
    },

    (clazz, method, parameter) => {
        if (clazz === "ShapeAttribute" && method === "strokeDashArray" && parameter === "value")
            return [$.sequence($.ref("Length"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ShapeAttribute" && method === "mesh" && parameter === "value")
            return [$.sequence($.num)]
    },

    (clazz, method, parameter) => {
        if (clazz === "GridAttribute" && method === "onItemDragStart" && parameter === "event")
            return onItemDragStartParameterType()
    },
    (clazz, method, parameter) => {
        if (clazz === "GridAttribute" && method === "onScroll" && parameter === "event")
            return [$.ref("Callback_Number_Number_Void")]
    },

    (clazz, method, parameter) => {
        if (clazz === "ListAttribute" && method === "onItemDragStart" && parameter === "event")
            return onItemDragStartParameterType()
    },
    (clazz, method, parameter) => {
        if (clazz === "ListAttribute" && method === "onScroll" && parameter === "event")
            return [$.ref("Callback_Number_Number_Void")]
    },
]

const typedefReplacements: ((typename: string) => [idl.IDLType, idl.IDLEntry?] | undefined )[] = [
    (typename) => {
        if (typename === "StyledStringValue")
            return [styledStringValueType()]
    },
]

const nameReplacements: ((filename: string, name: string) => string | undefined )[] = [
    (filename, name) => {
        if (filename === "common.d.ts" && name === "LinearGradient")
            return "LinearGradient_common"
    },
    (filename, name) => {
        if (filename === "alert_dialog.d.ts" && name === "TextStyle")
            return "TextStyle_alert_dialog"
    },
    (filename, name) => {
        if (filename === "styled_string.d.ts" && name === "TextStyle")
            return "TextStyle_styled_string"
    },
]

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
        "ColumnOptionsV2",
        "RowOptionsV2",
        "StyledStringValue",
    )

    static readonly ReplacedDeclarations = new Map<string, idl.IDLEntry>([
        ["CustomBuilder", idl.createCallback("CustomBuilder", [], idl.IDLVoidType)],
    ])

    static checkPropertyTypeReplacement(property: ts.PropertyDeclaration | ts.PropertySignature): [idl.IDLType?, idl.IDLEntry?] {
        const parent = property.parent
        if (!ts.isClassDeclaration(parent) && !ts.isInterfaceDeclaration(parent)) return []

        let propertyName = identName(property.name)!
        let parentName = identName(parent.name)!

        for (let filter of propertyTypeReplacements) {
            const result = filter(parentName, propertyName)
            if (result) {
                console.log(`Replaced type for ${parentName}.${propertyName}`)
                return result
            }
        }
        return []
    }

    static checkParameterTypeReplacement(parameter: ts.ParameterDeclaration): [idl.IDLType?, idl.IDLEntry?] {
        const method = parameter.parent
        if (!ts.isClassDeclaration(method.parent) && !ts.isInterfaceDeclaration(method.parent)) return []

        let parameterName = identName(parameter.name)!
        let methodName = identName(method.name)!
        let classOrInterfaceName = identName(method.parent.name)!

        for (let filter of parameterTypeReplacements) {
            const result = filter(classOrInterfaceName, methodName, parameterName)
            if (result) {
                console.log(`Replaced type for ${classOrInterfaceName}.${methodName}(...${parameterName}...)`)
                return result
            }
        }
        return []
    }

    static checkTypedefReplacement(typedef: ts.TypeAliasDeclaration): [idl.IDLType?, idl.IDLEntry?] {
        const typename = identName(typedef.name)!

        for (let filter of typedefReplacements) {
            const result = filter(typename)
            if (result) {
                console.log(`Replaced type for typedef ${typename}`)
                return result
            }
        }
        return []
    }

    static checkNameReplacement(name: string, file: ts.SourceFile): string {
        const filename: string = path.basename(file.fileName)

        for (let filter of nameReplacements) {
            const result = filter(filename, name)
            if (result) {
                console.log(`Replaced "${name}" with "${result}" in ${filename}`)
                return result
            }
        }
        return name
    }
}
