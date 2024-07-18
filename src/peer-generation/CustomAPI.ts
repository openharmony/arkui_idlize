
import {Type, Method, NamedMethodSignature} from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { capitalize } from "../util";


const K_VMCONTEXT_TYPE = new Type("KVMContext");
const ARK_VMCONTEXT_TYPE = new Type(`Ark_VMContext`);

const K_NATIVE_POINTER_TYPE = new Type("KNativePointerArray");
const ARK_FLOAT32_ARRAY_PTR_TYPE = new Type(`Ark_Float32*`);

const K_CHAR_PTR_TYPE = new Type("KCharPtr");
const ARK_CHAR_PTR_TYPE = new Type(`Ark_CharPtr`);

const K_FLOAT_ARRAY_TYPE = new Type("KFloatArray");
const ARK_FLOAT_ARRAY_TYPE = new Type("Ark_Float32*");

const NODE_TYPE_ENUM = new Type("NodeTypeEnum");
const ARK_NODE_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_NodeType`);

const K_LONG_TYPE = new Type("KLong")
const K_UINT_TYPE = new Type("KUInt")
const K_FLOAT_TYPE = new Type("KFloat")
const K_DOUBLE_TYPE = new Type("KDouble")

const EVENT_SUB_KIND_ENUM = new Type("EventSubKindeEnum");
const ARK_EVENT_SUB_KIND_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_EventSubKind`);

const ARK_NATIVE_POINTER_TYPE = new Type("Ark_NativePointer")
const RECEIVER_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}EventReceiver`)

const ARK_NODE_EVENT_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_NodeEvent`)

const PIPELINE_CONTEXT_TYPE = new Type(`PipelineContext`)
const ARK_PIPELINE_CONTEXT_TYPE = new Type(`Ark_PipelineContext`)

export class CustomAPI {

    typeMap = new Map<Type, [nativeType: Type, castType: Type, jniType: Type]>()

    constructor(public apiName: string, public methods: Method[], public withContext: boolean = false) {
        this.typeMap.set(Type.Void, [Type.Void, Type.Void, Type.Void])
        this.typeMap.set(Type.Int32, [new Type("Ark_Int32"), new Type("Ark_Int32"), new Type("int")])
        this.typeMap.set(Type.Pointer, [ARK_NATIVE_POINTER_TYPE, new Type("Ark_NodeHandle"), new Type("long")])
        this.typeMap.set(Type.Boolean, [new Type("KBoolean"), new Type("Ark_Boolean"), new Type("boolean")])
        this.typeMap.set(K_UINT_TYPE, [K_UINT_TYPE, new Type("Ark_UInt32"), new Type("int")])
        this.typeMap.set(K_LONG_TYPE, [new Type("Ark_Int64"), new Type("Ark_Int64"), new Type("long")])
        this.typeMap.set(K_FLOAT_TYPE, [new Type("Ark_Float32"), new Type("Ark_Float32"), new Type("float")])
        this.typeMap.set(K_DOUBLE_TYPE, [K_DOUBLE_TYPE, new Type("Ark_Float64"), new Type("double")])
        this.typeMap.set(K_VMCONTEXT_TYPE, [K_VMCONTEXT_TYPE, ARK_VMCONTEXT_TYPE, new Type("long")])
        this.typeMap.set(K_NATIVE_POINTER_TYPE, [K_NATIVE_POINTER_TYPE, ARK_FLOAT32_ARRAY_PTR_TYPE, new Type("long")])
        this.typeMap.set(K_CHAR_PTR_TYPE, [K_CHAR_PTR_TYPE, ARK_CHAR_PTR_TYPE, new Type("long")])
        this.typeMap.set(K_FLOAT_ARRAY_TYPE, [K_FLOAT_ARRAY_TYPE, ARK_FLOAT_ARRAY_TYPE, new Type("float[]")])
        this.typeMap.set(NODE_TYPE_ENUM, [new Type("Ark_Int32"), ARK_NODE_TYPE, new Type("int")])
        this.typeMap.set(EVENT_SUB_KIND_ENUM, [new Type("Ark_Int32"), ARK_EVENT_SUB_KIND_TYPE, new Type("int")])
        this.typeMap.set(ARK_NODE_EVENT_TYPE, [ARK_NATIVE_POINTER_TYPE, ARK_NODE_EVENT_TYPE, new Type("long")])
        this.typeMap.set(RECEIVER_TYPE, [ARK_NATIVE_POINTER_TYPE, RECEIVER_TYPE, new Type("long")])
        this.typeMap.set(PIPELINE_CONTEXT_TYPE, [ARK_NATIVE_POINTER_TYPE, ARK_PIPELINE_CONTEXT_TYPE, new Type("long")])
    }

    getArgType(type: Type) {
        return this.typeMap.get(type)![0]
    }

    getCastType(type: Type) {
        return this.typeMap.get(type)![1]
    }

    getJniType(type: Type) {
        return this.typeMap.get(type)![2]
    }
}

function method(name: string, returnType: Type, args: Type[], argsNames: string[]) {
    return new Method(name, new NamedMethodSignature(returnType, args, argsNames))
}

export const CUSTOM_API: CustomAPI[] = [

    // BasicNodeAPI
    new CustomAPI(
        "BasicNodeAPI", [
        method(`createNode`, Type.Pointer, [NODE_TYPE_ENUM, Type.Int32, Type.Int32], ["type", "id", "flags"]),
        method(`getNodeByViewStack`, Type.Pointer, [], []),
        method(`disposeNode`, Type.Void, [Type.Pointer], ["nodePtr"]),
        // TBD: Returns string
        // method(`getName`, K_CHAR_PTR_TYPE, [Type.Pointer], ["nodePtr"]),
        // method(`dump`, Type.Void, [Type.Pointer], ["nodePtr"]),

        method(`removeChild`, Type.Void, [Type.Pointer, Type.Pointer], ["parent", "child"]),
        method(`insertChildAfter`, Type.Int32, [Type.Pointer, Type.Pointer, Type.Pointer], ["parent", "child", "sibling"]),
        method(`addChild`, Type.Int32, [Type.Pointer, Type.Pointer], ["parent", "child"]),
        method(`insertChildBefore`, Type.Int32, [Type.Pointer, Type.Pointer, Type.Pointer], ["parent", "child", "sibling"]),
        method(`insertChildAt`, Type.Int32, [Type.Pointer, Type.Pointer, Type.Int32], ["parent", "child", "position"]),

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

        method(`applyModifierFinish`, Type.Void, [Type.Pointer], ["nodePtr"]),
        method(`markDirty`, Type.Void, [Type.Pointer, K_UINT_TYPE], ["nodePtr", "dirtyFlag"]),
        method(`isBuilderNode`, Type.Boolean, [Type.Pointer], ["nodePtr"]),
        method(`convertLengthMetricsUnit`, K_FLOAT_TYPE, [K_FLOAT_TYPE, Type.Int32, Type.Int32], ["value", "originUnit", "targetUnit"]),
    ]),

    // ExtendedNodeAPI with context
    new CustomAPI(
        "ExtendedNodeAPI", [
        // measureLayoutAndDraw returns void or Int32?
        method(`measureLayoutAndDraw`, Type.Void, [K_VMCONTEXT_TYPE, Type.Pointer], ["vmContext", "nodePtr"]),

        method(`measureNode`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),
        method(`drawNode`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),

        method(`indexerChecker`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer], ["vmContext", "nodePtr"]),
        method(`setLazyItemIndexer`, Type.Void, [K_VMCONTEXT_TYPE, Type.Pointer, Type.Int32], ["vmContext", "nodePtr", "indexerId"]),

        method(`setVsyncCallback`, Type.Void, [K_VMCONTEXT_TYPE, PIPELINE_CONTEXT_TYPE, Type.Int32], ["vmContext", "pipelineContext", "callbackId"]),
        method(`unblockVsyncWait`, Type.Void, [K_VMCONTEXT_TYPE, PIPELINE_CONTEXT_TYPE], ["vmContext", "pipelineContext"]),
        method(`setCustomCallback`, Type.Void, [K_VMCONTEXT_TYPE, Type.Pointer, Type.Int32], ["vmContext", "nodePtr", "updaterId"]),
    ], true),

    // ExtendedNodeAPI
    new CustomAPI(
        "ExtendedNodeAPI", [
        method(`setMeasureWidth`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "value"]),
        method(`getMeasureWidth`, Type.Int32, [Type.Pointer], ["nodePtr"]),
        method(`setMeasureHeight`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "value"]),
        method(`getMeasureHeight`, Type.Int32, [Type.Pointer], ["nodePtr"]),
        method(`setX`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "value"]),
        method(`getX`, Type.Int32, [Type.Pointer], ["nodePtr"]),
        method(`setY`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "value"]),
        method(`getY`, Type.Int32, [Type.Pointer], ["nodePtr"]),
        method(`setAlignment`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "value"]),
        method(`getAlignment`, Type.Int32, [Type.Pointer], ["nodePtr"]),

        method(`setRangeUpdater`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "updaterId"]),

        method(`getPipelineContext`, Type.Pointer, [Type.Pointer], ["nodePtr"]),

        method(`setChildTotalCount`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "totalCount"]),

        // custom realization is added to the bridge_epilogue
        //method(`showCrash`, Type.Void, [K_STRING_PTR_TYPE], ["messagePtr"]),
    ]),
]

function printCustomApiMethodTS(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = c.getArgType(sig.returnType).name
    let args = sig.args.map((type, index) => `${sig.argsNames[index]}: ${c.getArgType(type).name} `)
    args = c.withContext ? args.slice(1) : args
    const name = `_${capitalize(m.name)}`
    console.log(`  ${name}(${args.join(", ")}): ${ret}`)
}

function printCustomApiMethodJNI(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = c.getJniType(sig.returnType).name
    let args = sig.args.map((type, index) => `${c.getJniType(type).name} ${sig.argsNames[index]}`)
    args = c.withContext ? args.slice(1) : args
    const name = `_${capitalize(m.name)}`
    console.log(`  static native ${ret} ${name}(${args.join(", ")});`)
}

function printCustomApiMethodETS(c: CustomAPI, m: Method) {
    const sig = m.signature as NamedMethodSignature
    const ret = c.getJniType(sig.returnType).name
    let args = sig.args.map((type, index) => `${sig.argsNames[index]}: ${c.getJniType(type).name} `)
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
