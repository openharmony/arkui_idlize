import * as idl from "@idlizer/core/idl"
import { convertType, TypeConvertor } from "@idlizer/core"
import { ImportFeature } from "@idlizer/libohos"

class JavaImportsCollector implements TypeConvertor<ImportFeature[]> {
    convertOptional(type: idl.IDLOptionalType): ImportFeature[] {
        return this.convert(type.type)
    }
    convertUnion(type: idl.IDLUnionType): ImportFeature[] {
        return []
    }
    convertContainer(type: idl.IDLContainerType): ImportFeature[] {
        const result = type.elementType.flatMap(ty => convertType(this, ty))
        if (idl.IDLContainerUtils.isRecord(type)) {
            result.push({feature: "java.util.Map", module: ""})
        }
        return result
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): ImportFeature[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): ImportFeature[] {
        if (type.name === "Date") {
            return [{ feature: "java.util.Date", module: "" }]
        }
        return []
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ImportFeature[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ImportFeature[] {
        return []
    }
    convert(node: idl.IDLType | undefined): ImportFeature[] {
        return node ? convertType(this, node) : []
    }
}

function uniqueImports(imports: ImportFeature[]): ImportFeature[] {
    const seen = new Set<string>();
    return imports.filter(item => {
        const key = item.feature
        return seen.has(key) ? false : seen.add(key)
    });
}

export function collectJavaImports(nodes: idl.IDLNode[]): ImportFeature[] {
    const collector = new JavaImportsCollector()
    const allImports = nodes.filter(idl.isType).flatMap(node => collector.convert(node))
    return uniqueImports(allImports)
}
