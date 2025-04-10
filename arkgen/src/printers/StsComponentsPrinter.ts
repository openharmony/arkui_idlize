import * as idl from "@idlizer/core"
import { Language, LayoutNodeRole, PeerClass, PeerLibrary } from "@idlizer/core";
import { collapseSameNamedMethods, collectComponents, componentToPeerClass, ImportsCollector, PrinterResult, readLangTemplate, OverloadsPrinter, peerGeneratorConfiguration, groupOverloads } from "@idlizer/libohos";
import { ArkoalaPeerLibrary } from "../ArkoalaPeerLibrary";
import { generateArkComponentName } from "./ComponentsPrinter";

function printETSComponent(library: PeerLibrary, peer: PeerClass, isDeclaration: boolean): PrinterResult{
    const writer = library.createLanguageWriter(Language.ARKTS)
    const component = collectComponents(library).find(it => it.name === peer.componentName)!
    const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
    const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
    const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${idl.isOptionalType(it) ? "?" : ""}: ${writer.getNodeName(it)}`)
    const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
    const componentClassName = generateArkComponentName(peer.componentName)
    const peerClassName = componentToPeerClass(peer.componentName)
    writer.writeLines(readLangTemplate(isDeclaration ? "ets_component_decl.d.ets" : "ets_component_impl.ets", Language.ARKTS)
        .replaceAll("%COMPONENT_NAME%", component.name)
        .replaceAll("%FUNCTION_PARAMETERS%", mappedCallableParams?.map(it => `${it}, `).join("") ?? "")
        .replaceAll("%COMPONENT_CLASS_NAME%", componentClassName)
        .replaceAll("%PEER_CLASS_NAME%", peerClassName)
        .replaceAll("%PEER_CALLABLE_INVOKE%", callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : ""))
    return {
        over: {
            node: component.attributeDeclaration,
            role: LayoutNodeRole.INTERFACE,
        },
        collector: new ImportsCollector(),
        content: writer,
        weight: 99
    }
}

export function printETSDeclaration(library: PeerLibrary): PrinterResult[] {
    return library.files.flatMap<PrinterResult>(file =>
        file.peersToGenerate.filter(it => it.originalInterfaceName).flatMap<PrinterResult>(peer =>
            printETSComponent(library, peer, true)))
}