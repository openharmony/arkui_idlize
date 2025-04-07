import * as idl from "@idlizer/core"
import { Language, LanguageWriter, LayoutNodeRole, PeerClass, PeerLibrary } from "@idlizer/core";
import { collapseSameNamedMethods, collectComponents, componentToPeerClass, ImportsCollector, PrinterResult, readLangTemplate, OverloadsPrinter, peerGeneratorConfiguration, groupOverloads, findComponentByType, generateInterfaceParentInterface, convertPeerFilenameToModule, collectDeclDependencies, IdlComponentDeclaration, collapseIdlPeerMethods } from "@idlizer/libohos";
import { generateArkComponentName } from "./ComponentsPrinter";

function collectFunctionDeps(imports: ImportsCollector, library: PeerLibrary, peer: PeerClass, component: IdlComponentDeclaration) {
    imports.addFeatures(['int32', 'float32'], '@koalaui/common')
    imports.addFeatures(["KStringPtr", "KBoolean", "RuntimeType", "runtimeType"], "@koalaui/interop")
    imports.addFeatures(["NodeAttach", "remember"], "@koalaui/runtime")

    if (peer.originalParentFilename) {
        const [parentRef] = component.attributeDeclaration.inheritance
        const parentDecl = library.resolveTypeReference(parentRef)
        if (parentDecl) {
            const parentGeneratedPath = library.layout.resolve({
                node: parentDecl,
                role: LayoutNodeRole.COMPONENT
            })
            imports.addFeature(peer.parentComponentName!, `./${parentGeneratedPath}`)
        }
    }
    const peerModule = convertPeerFilenameToModule(peer.originalFilename)
    imports.addFeature(componentToPeerClass(peer.componentName), peerModule)

    // FIXME need a new machanism to resolve imports for ohos components
}

function printAttribute(printer: LanguageWriter, library: PeerLibrary, peer: PeerClass, component: IdlComponentDeclaration) {
    const attributeName = component.attributeDeclaration.name
    const parent = peer.parentComponentName
    printer.writeInterface(attributeName, (writer) => {
        const filteredMethods = peer.methods.filter(it =>
            !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, library.language))
        groupOverloads(filteredMethods).forEach((group, index) => {
            if (index == 0) return;
            const method = collapseIdlPeerMethods(library, group)
            writer.print(`/** @memo */`)
            writer.writeMethodDeclaration(method.method.name, method.method.signature)
        })
    }, parent ? [parent] : undefined)
}

function printETSComponent(library: PeerLibrary, peer: PeerClass): PrinterResult {
    const imports = new ImportsCollector()
    const component = collectComponents(library).find(it => it.name === peer.componentName)!
    const writer = library.createLanguageWriter(Language.ARKTS)

    collectFunctionDeps(imports, library, peer, component)
    printAttribute(writer, library, peer, component)

    const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
    const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
    const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${idl.isOptionalType(it) ? "?" : ""}: ${writer.getNodeName(it)}`)
    const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
    const componentClassName = generateArkComponentName(peer.componentName)
    const peerClassName = componentToPeerClass(peer.componentName)
    writer.writeLines(readLangTemplate("ets_component_impl.ets", Language.ARKTS)
        .replaceAll("%COMPONENT_NAME%", component.name)
        .replaceAll("%FUNCTION_PARAMETERS%", mappedCallableParams?.map(it => `${it}, `).join("") ?? "")
        .replaceAll("%COMPONENT_CLASS_NAME%", componentClassName)
        .replaceAll("%PEER_CLASS_NAME%", peerClassName)
        .replaceAll("%PEER_CALLABLE_INVOKE%", callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : ""))


    return {
        over: {
            node: component.attributeDeclaration,
            role: LayoutNodeRole.COMPONENT,
        },
        collector: imports,
        content: writer,
        weight: 99
    }
}

export function printETSComponents(library: PeerLibrary): PrinterResult[] {
    return library.files
        .flatMap<PrinterResult>(
            file => file.peersToGenerate
                .filter(p => collectComponents(library).find(it => it.name === p.componentName)?.interfaceDeclaration)
                .flatMap<PrinterResult>(peer => printETSComponent(library, peer))
        )
}
