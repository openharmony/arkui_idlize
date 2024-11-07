import * as idl from "../../../idl"
import { convertDeclaration, convertType, DeclarationConvertor, TypeConvertor } from "../../LanguageWriters/nameConvertor"
import { ImportFeature } from "../../ImportsCollector"

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
    convertCallback(decl: idl.IDLCallback): ImportFeature[] {
        // TODO: add types like Consumer/Supplier/...
        return [
            ...decl.parameters.flatMap(it => convertType(this, it.type!)),
            ...convertType(this, decl.returnType),
        ]
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


class JavaDeclarationImportsCollector implements DeclarationConvertor<ImportFeature[]> {
    private readonly typeDepsCollector = new JavaImportsCollector()

    convertInterface(decl: idl.IDLInterface): ImportFeature[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.convertSupertype(it)),
            ...decl.properties.flatMap(it => this.typeDepsCollector.convert(it.type)),
            ...[...decl.callables, ...decl.methods].flatMap(it => [
                ...it.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
                ...this.typeDepsCollector.convert(it.returnType)])
        ]
    }
    protected convertSupertype(type: idl.IDLType): ImportFeature[] {
        return this.typeDepsCollector.convert(type)
    }
    convertEnum(decl: idl.IDLEnum): ImportFeature[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): ImportFeature[] {
        return convertType(this.typeDepsCollector, decl.type)
    }
    convertCallback(decl: idl.IDLCallback): ImportFeature[] {
        return [
            ...decl.parameters.flatMap(it => convertType(this.typeDepsCollector, it.type!)),
            ...convertType(this.typeDepsCollector, decl.returnType),
        ]
    }
    convert(node: idl.IDLEntry | undefined): ImportFeature[] {
        if (node === undefined)
            return []
        return convertDeclaration(this, node)
    }
}

export function collectJavaImportsForDeclaration(declaration: idl.IDLEntry | undefined): ImportFeature[] {
    const collector = new JavaDeclarationImportsCollector()
    return uniqueImports(collector.convert(declaration))
}
