import * as idl from '@idlize/core/idl'
import * as ts from "typescript"
import { identName } from '@idlize/core'

function radiusParameterType(): idl.IDLType {
    return idl.createUnionType([
        idl.IDLNumberType,
        idl.IDLStringType,
        idl.createContainerType("sequence", [
            idl.createUnionType([idl.IDLNumberType, idl.IDLStringType])
        ]),
    ])
}

function onItemDragStartParameterType(): [idl.IDLType, idl.IDLEntry] {
    //(event: ItemDragInfo, itemIndex: number) => CustomBuilder
    const callback = idl.createCallback(
        "Callback_ItemDragInfo_Number_CustomBuilder",
        [
            idl.createParameter("event", idl.createReferenceType("ItemDragInfo")),
            idl.createParameter("itemIndex", idl.IDLNumberType),
        ],
        idl.createReferenceType("CustomBuilder"),
        { fileName: "IDLVisitorConfig.ts" },
    )
    return [idl.createReferenceType(callback.name), callback]
}

const propertyTypeReplacements: ((clazz: string, property: string) => [idl.IDLType, idl.IDLEntry?] | undefined )[] = [
    (clazz, property) => {
        if (clazz === "Resource" && property === "params")
            return [idl.createContainerType("sequence", [idl.IDLStringType])]
    },
    (clazz, property) => {
        if (clazz === "RectOptions" && property === "radius")
            return [radiusParameterType()]
    },
    (clazz, property) => {
        if (clazz === "PluginComponentOptions" && property === "data")
            return [idl.IDLStringType]
    },
]

const parameterTypeReplacements: ((clazz: string, method: string, parameter: string) => [idl.IDLType, idl.IDLEntry?] | undefined )[] = [
    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onWillScroll" && parameter === "handler")
            return [idl.createOptionalType(idl.createReferenceType("ScrollOnWillScrollCallback"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onDidScroll" && parameter === "handler")
            return [idl.createOptionalType(idl.createReferenceType("ScrollOnScrollCallback"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollableCommonMethod" && method === "onScroll" && parameter === "event")
            return [idl.createReferenceType("Callback_Number_Number_Void")]
    },

    (clazz, method, parameter) => {
        if (clazz === "ScrollAttribute" && method === "onWillScroll" && parameter === "handler")
            return [idl.createOptionalType(idl.createReferenceType("ScrollOnWillScrollCallback"))]
    },
    (clazz, method, parameter) => {
        if (clazz === "ScrollAttribute" && method === "onDidScroll" && parameter === "handler")
            return [idl.createOptionalType(idl.createReferenceType("ScrollOnScrollCallback"))]
    },

    (clazz, method, parameter) => {
        if (clazz === "CommonMethod" && method === "size" && parameter === "value")
            return [idl.createReferenceType("SizeOptions")]
    },
    (clazz, method, parameter) => {
        if (clazz === "FormComponentAttribute" && method === "size" && parameter === "value")
            return [idl.createReferenceType("SizeOptions")]
    },

    (clazz, method, parameter) => {
        if (clazz === "LineAttribute" && method === "startPoint" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Length")])]
    },
    (clazz, method, parameter) => {
        if (clazz === "LineAttribute" && method === "endPoint" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Length")])]
    },

    (clazz, method, parameter) => {
        if (clazz === "PolygonAttribute" && method === "points" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Point")])]
    },
    (clazz, method, parameter) => {
        if (clazz === "PolylineAttribute" && method === "points" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Point")])]
    },

    (clazz, method, parameter) => {
        if (clazz === "RectAttribute" && method === "radius" && parameter === "value")
            return [radiusParameterType()]
    },

    (clazz, method, parameter) => {
        if (clazz === "CanvasRenderingContext2D" && method === "toDataURL" && parameter === "quality")
            return [idl.IDLNumberType]
    },

    (clazz, method, parameter) => {
        if (clazz === "CommonShapeMethod" && method === "strokeDashArray" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Length")])]
    },

    (clazz, method, parameter) => {
        if (clazz === "ShapeAttribute" && method === "strokeDashArray" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.createReferenceType("Length")])]
    },
    (clazz, method, parameter) => {
        if (clazz === "ShapeAttribute" && method === "mesh" && parameter === "value")
            return [idl.createContainerType("sequence", [idl.IDLNumberType])]
    },

    (clazz, method, parameter) => {
        if (clazz === "GridAttribute" && method === "onItemDragStart" && parameter === "event")
            return onItemDragStartParameterType()
    },
    (clazz, method, parameter) => {
        if (clazz === "GridAttribute" && method === "onScroll" && parameter === "event")
            return [idl.createReferenceType("Callback_Number_Number_Void")]
    },

    (clazz, method, parameter) => {
        if (clazz === "ListAttribute" && method === "onItemDragStart" && parameter === "event")
            return onItemDragStartParameterType()
    },
    (clazz, method, parameter) => {
        if (clazz === "ListAttribute" && method === "onScroll" && parameter === "event")
            return [idl.createReferenceType("Callback_Number_Number_Void")]
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
}