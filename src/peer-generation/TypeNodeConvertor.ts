import * as ts from 'typescript'

export interface TypeNodeConvertor<T> {
    convertUnion(node: ts.UnionTypeNode): T
    convertTypeLiteral(node: ts.TypeLiteralNode): T
    convertLiteralType(node: ts.LiteralTypeNode): T
    convertTuple(node: ts.TupleTypeNode): T
    convertArray(node: ts.ArrayTypeNode): T
    convertOptional(node: ts.OptionalTypeNode): T
    convertFunction(node: ts.FunctionTypeNode): T
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): T
    convertImport(node: ts.ImportTypeNode): T
    convertTypeReference(node: ts.TypeReferenceNode): T
    convertTypeAlias(node: ts.TypeAliasDeclaration): T
    convertParenthesized(node: ts.ParenthesizedTypeNode): T
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): T
    convertStringKeyword(node: ts.TypeNode): T
    convertNumberKeyword(node: ts.TypeNode): T
    convertBooleanKeyword(node: ts.TypeNode): T
    convertUndefinedKeyword(node: ts.TypeNode): T
    convertVoidKeyword(node: ts.TypeNode): T
    convertObjectKeyword(node: ts.TypeNode): T
    convertAnyKeyword(node: ts.TypeNode): T
    convertUnknownKeyword(node: ts.TypeNode): T
}

export function convertTypeNode<T>(convertor: TypeNodeConvertor<T>, node: ts.TypeNode): T {
    if (ts.isUnionTypeNode(node)) return convertor.convertUnion(node)
    if (ts.isTypeLiteralNode(node)) return convertor.convertTypeLiteral(node)
    if (ts.isLiteralTypeNode(node)) return convertor.convertLiteralType(node)
    if (ts.isTupleTypeNode(node)) return convertor.convertTuple(node)
    if (ts.isArrayTypeNode(node)) return convertor.convertArray(node)
    if (ts.isOptionalTypeNode(node)) return convertor.convertOptional(node)
    if (ts.isFunctionTypeNode(node)) return convertor.convertFunction(node)
    if (ts.isTemplateLiteralTypeNode(node)) return convertor.convertTemplateLiteral(node)
    if (ts.isImportTypeNode(node)) return convertor.convertImport(node)
    if (ts.isTypeReferenceNode(node)) return convertor.convertTypeReference(node)
    if (ts.isTypeAliasDeclaration(node)) return convertor.convertTypeAlias(node)
    if (ts.isParenthesizedTypeNode(node)) return convertor.convertParenthesized(node)
    if (ts.isIndexedAccessTypeNode(node)) return convertor.convertIndexedAccess(node)
    if (node.kind == ts.SyntaxKind.StringKeyword) return convertor.convertStringKeyword(node)
    if (node.kind == ts.SyntaxKind.NumberKeyword) return convertor.convertNumberKeyword(node)
    if (node.kind == ts.SyntaxKind.BooleanKeyword) return convertor.convertBooleanKeyword(node)
    if (node.kind == ts.SyntaxKind.UndefinedKeyword) return convertor.convertUndefinedKeyword(node)
    if (node.kind == ts.SyntaxKind.VoidKeyword) return convertor.convertVoidKeyword(node)
    if (node.kind == ts.SyntaxKind.ObjectKeyword) return convertor.convertObjectKeyword(node)
    if (node.kind == ts.SyntaxKind.AnyKeyword) return convertor.convertAnyKeyword(node)
    if (node.kind == ts.SyntaxKind.UnknownKeyword) return convertor.convertUnknownKeyword(node)
    throw new Error(`Unknown TypeNode ${ts.SyntaxKind[node.kind]}`)
}
