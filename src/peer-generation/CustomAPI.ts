
import {Type, Method, NamedMethodSignature} from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";


const K_VMCONTEXT_TYPE = new Type("KVMContext");
const ARK_VMCONTEXT_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_VMContext`);

const K_NATIVE_POINTER_TYPE = new Type("KNativePointerArray");
const ARK_FLOAT32_ARRAY_PTR_TYPE = new Type(`Ark_Float32*`);

const K_STRING_PTR_TYPE = new Type("KStringPtr");
const ARK_CHAR_PTR_TYPE = new Type(`Ark_CharPtr`);

const K_FLOAT_ARRAY_TYPE = new Type("KFloatArray");
const ARK_FLOAT_ARRAY_TYPE = new Type("Ark_Float32*");

const NODE_TYPE_ENUM = new Type("NodeTypeEnum");
const ARK_NODE_TYPE = new Type(`${PeerGeneratorConfig.cppPrefix}Ark_NodeType`);

export class CustomAPI {

    typeMap = new Map<Type, [nativeType: Type, castType: Type, jniType: Type]>()

    constructor(public apiName: string, public methods: Method[], public withContext: boolean = false) {
        this.typeMap.set(Type.Void, [Type.Void, Type.Void, Type.Void])
        this.typeMap.set(Type.Int32, [new Type("Ark_Int32"), new Type("Ark_Int32"), new Type("int")])
        this.typeMap.set(Type.Pointer, [new Type("Ark_NativePointer"), new Type("Ark_NodeHandle"), new Type("long")])
        this.typeMap.set(K_VMCONTEXT_TYPE, [K_VMCONTEXT_TYPE, ARK_VMCONTEXT_TYPE, new Type("long")])
        this.typeMap.set(K_NATIVE_POINTER_TYPE, [K_NATIVE_POINTER_TYPE, ARK_FLOAT32_ARRAY_PTR_TYPE, new Type("long")])
        this.typeMap.set(K_STRING_PTR_TYPE, [K_STRING_PTR_TYPE, ARK_CHAR_PTR_TYPE, new Type("long")])
        this.typeMap.set(K_FLOAT_ARRAY_TYPE, [K_FLOAT_ARRAY_TYPE, ARK_FLOAT_ARRAY_TYPE, new Type("float[]")])
        this.typeMap.set(NODE_TYPE_ENUM, [new Type("Ark_Int32"), ARK_NODE_TYPE, new Type("int")])
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
        method(`disposeNode`, Type.Void, [Type.Pointer], ["nodePtr"]),
    ]),

    // ExtendedNodeAPI with context
    new CustomAPI(
        "ExtendedNodeAPI", [
        // measureLayoutAndDraw returns void or Int32?
        method(`measureLayoutAndDraw`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer], ["vmContext", "nodePtr"]),

        method(`measureNode`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),
        method(`layoutNode`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),
        method(`drawNode`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer, K_FLOAT_ARRAY_TYPE], ["vmContext", "nodePtr", "data"]),

        method(`indexerChecker`, Type.Int32, [K_VMCONTEXT_TYPE, Type.Pointer], ["vmContext", "nodePtr"]),
        method(`setLazyItemIndexer`, Type.Void, [K_VMCONTEXT_TYPE, Type.Pointer, Type.Int32], ["vmContext", "nodePtr", "indexerId"]),
    ], true),

    // ExtendedNodeAPI
    new CustomAPI(
        "ExtendedNodeAPI", [
        // setCustomCallback is without the context
        method(`setCustomCallback`, Type.Void, [Type.Pointer, Type.Int32], ["nodePtr", "updaterId"]),

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

        // ???
        // getName
        // getId
        // get/set/resetAttribute
        // dump

        // added in bridge_epilogue
        //method(`showCrash`, Type.Void, [K_STRING_PTR_TYPE], ["messagePtr"]),

        // stringLength/Data/Make
        // getStringFinalizer
        // getNodeFinalizer
        // getInteropProfiler
        // resetProfile

        // checArkoalaEvents
    ]),
]