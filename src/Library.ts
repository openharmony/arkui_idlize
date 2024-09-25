import { Language } from "./util"

export interface Library<FileType> {
    language: Language
    files: FileType[]
    findFileByOriginalFilename(filename: string): FileType | undefined 
}

export class PrimitiveType_ {
    constructor(protected name: string, public isPointer = false) { }
    getText(): string { return this.name }
    static OptionalPrefix = "Opt_"
    static Prefix = ""
    static String = new PrimitiveType_(`String`, true)
    static Number = new PrimitiveType_(`Number`, true)
    static Int32 = new PrimitiveType_(`Int32`)
    static Tag = new PrimitiveType_(`Tag`)
    static RuntimeType = new PrimitiveType_(`RuntimeType`)
    static Boolean = new PrimitiveType_(`Boolean`)
    static Function = new PrimitiveType_(`Function`, false)
    static Materialized = new PrimitiveType_(`Materialized`, true)
    static Undefined = new PrimitiveType_(`Undefined`)
    static NativePointer = new PrimitiveType_(`NativePointer`)
    static ObjectHandle = new PrimitiveType_(`ObjectHandle`)
    static Length = new PrimitiveType_(`Length`, true)
    static CustomObject = new PrimitiveType_(`CustomObject`, true)
}

export interface Library<FileType> {
    language: Language
    files: FileType[]
    findFileByOriginalFilename(filename: string): FileType | undefined 
}
