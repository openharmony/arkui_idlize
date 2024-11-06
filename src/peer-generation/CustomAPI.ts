
import { Method, NamedMethodSignature} from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { capitalize } from "../util";
import { forceAsNamedNode, IDLBooleanType, IDLI32Type, IDLPointerType, IDLType, IDLVoidType, isOptionalType, toIDLType } from "../idl";


// TODO: remove this API.

const K_VMCONTEXT_TYPE = toIDLType("KVMContext");
const ARK_VMCONTEXT_TYPE = toIDLType(`Ark_VMContext`);

const K_NATIVE_POINTER_TYPE = toIDLType("KNativePointerArray");
const ARK_FLOAT32_ARRAY_PTR_TYPE = toIDLType(`Ark_Float32*`);

const K_CHAR_PTR_TYPE = toIDLType("KCharPtr");
const ARK_CHAR_PTR_TYPE = toIDLType(`Ark_CharPtr`);

const K_FLOAT_ARRAY_TYPE = toIDLType("KFloatArray");
const ARK_FLOAT_ARRAY_TYPE = toIDLType("Ark_Float32*");

const NODE_TYPE_ENUM = toIDLType("NodeTypeEnum");
const ARK_NODE_TYPE = toIDLType(`${PeerGeneratorConfig.cppPrefix}Ark_NodeType`);

const K_LONG_TYPE = toIDLType("KLong")
const K_UINT_TYPE = toIDLType("KUInt")
const K_FLOAT_TYPE = toIDLType("KFloat")
const K_DOUBLE_TYPE = toIDLType("KDouble")

const EVENT_SUB_KIND_ENUM = toIDLType("EventSubKindeEnum");
const ARK_EVENT_SUB_KIND_TYPE = toIDLType(`${PeerGeneratorConfig.cppPrefix}Ark_EventSubKind`);

const ARK_NATIVE_POINTER_TYPE = toIDLType("Ark_NativePointer")
const RECEIVER_TYPE = toIDLType(`${PeerGeneratorConfig.cppPrefix}EventReceiver`)

const ARK_NODE_EVENT_TYPE = toIDLType(`${PeerGeneratorConfig.cppPrefix}Ark_NodeEvent`)

const PIPELINE_CONTEXT_TYPE = toIDLType(`PipelineContext`)
const ARK_PIPELINE_CONTEXT_TYPE = toIDLType(`Ark_PipelineContext`)

export class CustomAPI {

    typeMap = new Map<string, [nativeType: IDLType, castType: IDLType, jniType: IDLType]>()

    constructor(public apiName: string, public methods: Method[], public withContext: boolean = false) {
        this.typeMap.set(forceAsNamedNode(IDLVoidType).name, [IDLVoidType, IDLVoidType, IDLVoidType])
        this.typeMap.set(forceAsNamedNode(IDLI32Type).name, [toIDLType("Ark_Int32"), toIDLType("Ark_Int32"), toIDLType("int")])
        this.typeMap.set(forceAsNamedNode(IDLPointerType).name, [ARK_NATIVE_POINTER_TYPE, toIDLType("Ark_NodeHandle"), toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(IDLBooleanType).name, [toIDLType("KBoolean"), toIDLType("Ark_Boolean"), toIDLType("boolean")])
        this.typeMap.set(forceAsNamedNode(K_UINT_TYPE).name, [K_UINT_TYPE, toIDLType("Ark_UInt32"), toIDLType("int")])
        this.typeMap.set(forceAsNamedNode(K_LONG_TYPE).name, [toIDLType("Ark_Int64"), toIDLType("Ark_Int64"), toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(K_FLOAT_TYPE).name, [toIDLType("Ark_Float32"), toIDLType("Ark_Float32"), toIDLType("float")])
        this.typeMap.set(forceAsNamedNode(K_DOUBLE_TYPE).name, [K_DOUBLE_TYPE, toIDLType("Ark_Float64"), toIDLType("double")])
        this.typeMap.set(forceAsNamedNode(K_VMCONTEXT_TYPE).name, [K_VMCONTEXT_TYPE, ARK_VMCONTEXT_TYPE, toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(K_NATIVE_POINTER_TYPE).name, [K_NATIVE_POINTER_TYPE, ARK_FLOAT32_ARRAY_PTR_TYPE, toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(K_CHAR_PTR_TYPE).name, [K_CHAR_PTR_TYPE, ARK_CHAR_PTR_TYPE, toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(K_FLOAT_ARRAY_TYPE).name, [K_FLOAT_ARRAY_TYPE, ARK_FLOAT_ARRAY_TYPE, toIDLType("float[]")])
        this.typeMap.set(forceAsNamedNode(NODE_TYPE_ENUM).name, [toIDLType("Ark_Int32"), ARK_NODE_TYPE, toIDLType("int")])
        this.typeMap.set(forceAsNamedNode(EVENT_SUB_KIND_ENUM).name, [toIDLType("Ark_Int32"), ARK_EVENT_SUB_KIND_TYPE, toIDLType("int")])
        this.typeMap.set(forceAsNamedNode(ARK_NODE_EVENT_TYPE).name, [ARK_NATIVE_POINTER_TYPE, ARK_NODE_EVENT_TYPE, toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(RECEIVER_TYPE).name, [ARK_NATIVE_POINTER_TYPE, RECEIVER_TYPE, toIDLType("long")])
        this.typeMap.set(forceAsNamedNode(PIPELINE_CONTEXT_TYPE).name, [ARK_NATIVE_POINTER_TYPE, ARK_PIPELINE_CONTEXT_TYPE, toIDLType("long")])
    }

    getArgType(type: IDLType) {
        return this.typeMap.get(forceAsNamedNode(type).name)![0]
    }

    getCastType(type: IDLType) {
        return this.typeMap.get(forceAsNamedNode(type).name)![1]
    }

    getJniType(type: IDLType) {
        return this.typeMap.get(forceAsNamedNode(type).name)![2]
    }
}

function method(name: string, returnType: IDLType, args: IDLType[], argsNames: string[]) {
    return new Method(name, new NamedMethodSignature(returnType, args, argsNames))
}

export const CUSTOM_API: CustomAPI[] = [

    // BasicNodeAPI
    new CustomAPI(
        "BasicNodeAPI", [
        method(`createNode`, IDLPointerType, [NODE_TYPE_ENUM, IDLI32Type, IDLI32Type], ["type", "id", "flags"]),
        method(`getNodeByViewStack`, IDLPointerType, [], []),
        method(`disposeNode`, IDLVoidType, [IDLPointerType], ["nodePtr"]),
        method(`dumpTreeNode`, IDLVoidType, [IDLPointerType], ["nodePtr"]),
        // TBD: Returns string
        // method(`getName`, K_CHAR_PTR_TYPE, [IDLPointerType], ["nodePtr"]),

        method(`removeChild`, IDLVoidType, [IDLPointerType, IDLPointerType], ["parent", "child"]),
        method(`insertChildAfter`, IDLI32Type, [IDLPointerType, IDLPointerType, IDLPointerType], ["parent", "child", "sibling"]),
        method(`addChild`, IDLI32Type, [IDLPointerType, IDLPointerType], ["parent", "child"]),
        method(`insertChildBefore`, IDLI32Type, [IDLPointerType, IDLPointerType, IDLPointerType], ["parent", "child", "sibling"]),
        method(`insertChildAt`, IDLI32Type, [IDLPointerType, IDLPointerType, IDLI32Type], ["parent", "child", "position"]),

        // May be obsolete api, returns string
        // method(`getAttribute`, K_CHAR_PTR_TYPE, [Type.Pointer, K_CHAR_PTR_TYPE], ["nodePtr", "attribute"]),
        // method(`setAttribute`, Type.Void, [Type.Pointer, K_CHAR_PTR_TYPE, K_CHAR_PTR_TYPE], ["nodePtr", "attribute", "value"]),
        // method(`resetAttribute`, Type.Void, [Type.Pointer, K_CHAR_PTR_TYPE], ["nodePtr", "attribute"]),

        // TBD: Fix Java Int64
        // method(`registerNodeAsyncEvent`, Type.Void, [Type.Pointer, EVENT_SUB_KIND_ENUM, K_LONG_TYPE], ["nodePtr", "kind", "extraParam"]),
        // method(`unRegisterNodeAsyncEvent`, Type.Void, [Type.Pointer, EVENT_SUB_KIND_ENUM], ["nodePtr", "kind"]),
        // method(`registerNodeAsyncEventReceiver`, Type.Void, [RECEIVER_TYPE], ["eventReceiver"]),
        // method(`unRegisterNodeAsyncEventReceiver`, Type.Void, [], []),
        // TBD: convert NodeEvent struct
        // method(`checkAsyncEvent`, Type.Int32, [ARK_NODE_EVENT_TYPE], ["event"]),

        method(`applyModifierFinish`, IDLVoidType, [IDLPointerType], ["nodePtr"]),
        method(`markDirty`, IDLVoidType, [IDLPointerType, K_UINT_TYPE], ["nodePtr", "dirtyFlag"]),
        method(`isBuilderNode`, IDLBooleanType, [IDLPointerType], ["nodePtr"]),
        method(`convertLengthMetricsUnit`, K_FLOAT_TYPE, [K_FLOAT_TYPE, IDLI32Type, IDLI32Type], ["value", "originUnit", "targetUnit"]),
    ]),

    // ExtendedNodeAPI with context
    new CustomAPI(
        "ExtendedNodeAPI", [
        // measureLayoutAndDraw returns void or Int32?
        method(`measureLayoutAndDraw`, IDLVoidType, [K_VMCONTEXT_TYPE, IDLPointerType], ["vmContext", "nodePtr"]),

        method(`measureNode`, IDLI32Type, [K_VMCONTEXT_TYPE, IDLPointerType, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),
        method(`drawNode`, IDLI32Type, [K_VMCONTEXT_TYPE, IDLPointerType, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),

        method(`indexerChecker`, IDLI32Type, [K_VMCONTEXT_TYPE, IDLPointerType], ["vmContext", "nodePtr"]),
        method(`setLazyItemIndexer`, IDLVoidType, [K_VMCONTEXT_TYPE, IDLPointerType, IDLI32Type], ["vmContext", "nodePtr", "indexerId"]),

        method(`setVsyncCallback`, IDLVoidType, [K_VMCONTEXT_TYPE, PIPELINE_CONTEXT_TYPE, IDLI32Type], ["vmContext", "pipelineContext", "callbackId"]),
        method(`unblockVsyncWait`, IDLVoidType, [K_VMCONTEXT_TYPE, PIPELINE_CONTEXT_TYPE], ["vmContext", "pipelineContext"]),
        method(`setCustomCallback`, IDLVoidType, [K_VMCONTEXT_TYPE, IDLPointerType, IDLI32Type], ["vmContext", "nodePtr", "updaterId"]),
    ], true),

    // ExtendedNodeAPI
    new CustomAPI(
        "ExtendedNodeAPI", [
        method(`setMeasureWidth`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "value"]),
        method(`getMeasureWidth`, IDLI32Type, [IDLPointerType], ["nodePtr"]),
        method(`setMeasureHeight`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "value"]),
        method(`getMeasureHeight`, IDLI32Type, [IDLPointerType], ["nodePtr"]),
        method(`setX`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "value"]),
        method(`getX`, IDLI32Type, [IDLPointerType], ["nodePtr"]),
        method(`setY`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "value"]),
        method(`getY`, IDLI32Type, [IDLPointerType], ["nodePtr"]),
        method(`setAlignment`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "value"]),
        method(`getAlignment`, IDLI32Type, [IDLPointerType], ["nodePtr"]),

        method(`setRangeUpdater`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "updaterId"]),

        method(`getPipelineContext`, IDLPointerType, [IDLPointerType], ["nodePtr"]),

        method(`setChildTotalCount`, IDLVoidType, [IDLPointerType, IDLI32Type], ["nodePtr", "totalCount"]),

        // custom realization is added to the bridge_epilogue
        //method(`showCrash`, Type.Void, [K_STRING_PTR_TYPE], ["messagePtr"]),
    ]),
]

function printCustomApiMethodTS(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = forceAsNamedNode(c.getArgType(sig.returnType)).name
    let args = sig.args.map((type, index) => `${sig.argsNames[index]}: ${forceAsNamedNode(c.getArgType(type)).name} `)
    args = c.withContext ? args.slice(1) : args
    const name = `_${capitalize(m.name)}`
    console.log(`  ${name}(${args.join(", ")}): ${ret}`)
}

function printCustomApiMethodJNI(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = forceAsNamedNode(c.getJniType(sig.returnType)).name
    let args = sig.args.map((type, index) => `${forceAsNamedNode(c.getJniType(type)).name} ${sig.argsNames[index]}`)
    args = c.withContext ? args.slice(1) : args
    const name = `_${capitalize(m.name)}`
    console.log(`  static native ${ret} ${name}(${args.join(", ")});`)
}

function printCustomApiMethodETS(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = forceAsNamedNode(c.getJniType(sig.returnType)).name
    let args = sig.args.map((type, index) => `${sig.argsNames[index]}: ${forceAsNamedNode(c.getJniType(type)).name} `)
    args = c.withContext ? args.slice(1) : args
    const name = `_${capitalize(m.name)}`
    console.log(`  static native ${name}(${args.join(", ")}): ${ret}`)
}

function printCustomAPIMethods(langName: string, printMethod: (c: CustomAPI, m: Method) => void ): void {
    console.log(`// ${langName}`)
    for (const customApi of CUSTOM_API) {
        console.log(`// ${customApi.apiName}`)
        for (const method of customApi.methods) {
            printMethod(customApi, method)
        }
    }
}

if (false) {
    printCustomAPIMethods("TypeScript", printCustomApiMethodTS)
    printCustomAPIMethods("JNI", printCustomApiMethodJNI)
    printCustomAPIMethods("ETS", printCustomApiMethodETS)
}
