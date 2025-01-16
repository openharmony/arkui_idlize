import { isMethod, IDLInterface, IDLInterfaceSubkind, IDLKind, IDLParameter, IDLType, createConstructor, createContainerType, createInterface, forEachChild, isConstructor, isContainerType, isInterface, isReferenceType, toIDLString, IDLEntry } from "@idlize/core/idl"


// TODO: until we get an equivalent of it in @idlize/core
export class IDLFile {
    constructor(public entries: IDLEntry[]) {}
}

// TODO: unfortunately we don't have IDL transformers yet.
// So we update IDL tree "in place".
// This is no good.
export class Es2PandaTransformer {
    private classes = new Map<string, IDLInterface>()
    constructor(private idl: IDLFile) {}

    detectClasses() {
        this.idl.entries.forEach(
            entry => forEachChild(entry, node => {
                if (isMethod(node)) {
                    if (node.name.startsWith("Create")) {
                        this.lookupInterface(node.name.substring("Create".length))
                    }
                }
            })
        )

    }

    sortClasses() {
        this.classes = new Map(
            Array.from(this.classes)
                .sort((a:any, b:any) =>
                    a[0].localeCompare(b[0])
                )
        )
    }

    lookupInterface(name: string): IDLInterface {
        if (this.classes.has(name)) return this.classes.get(name)!

        const iface = createInterface(
            name,
            IDLInterfaceSubkind.Interface,
            [],
            [],
            [],
            [],
            [],
            [],
            []
        )
        this.classes.set(name, iface)
        return iface
    }

    transferMethods() {
        this.idl.entries.forEach(entry => {
            forEachChild(entry, node => {
                if (isMethod(node)) {
                    const clazzName = detectConstructor(node.name)
                    if (clazzName) {
                        this.lookupInterface(clazzName).constructors.push(
                            createConstructor(
                                node.parameters,
                                undefined
                            )
                        )
                    }
                    const clazzName2 = className(this.classes, node.name)
                    if (clazzName2) {
                        node.name = methodName(clazzName2, node.name)!
                        this.lookupInterface(clazzName2).methods.push(
                            node
                        )
                    }
                }
            })
        })
    }

    addClassesToFile(es2pandaFile: IDLFile) {
        es2pandaFile.entries.push(...Array.from(this.classes.values()).flat())
    }

    dropEs2pandaPrefix() {
        this.idl.entries.forEach(entry => {
                forEachChild(entry, node => {
                    if (isReferenceType(node) && node.name.startsWith("es2panda_")) {
                        node.name = node.name.substring("es2panda_".length)
                    }
                })
            })
    }

    postProcess() {
        this.idl.entries.forEach(
                entry => forEachChild(entry, node => {
                    if (isMethod(node) || isConstructor(node)) {
                        const type = node.returnType
                        if (type) {
                            node.returnType = processType(type)
                        }
                        node.extendedAttributes = node.extendedAttributes?.filter(it =>
                            (it.name != "ptr_1") && (it.name != "ptr_2") && (it.name != "constant")
                        )

                        node.parameters.forEach(it => {
                            if (it.type) it.type = processType(it.type)
                        })
                        node.parameters = node.parameters
                            .map((it, index) => killUnneededParameters(node.parameters, index))
                            .filter(it => it != undefined) as IDLParameter[]
                    }
                })
            )
    }

    transform() {
        const es2pandaInterface = this.idl.entries.filter(it => it.name == "es2panda_Impl")[0]

        if (!isInterface(es2pandaInterface)) {
            throw new Error(`Expected a single es2panda module, got ${IDLKind[es2pandaInterface.kind]} ${es2pandaInterface.name}`)
        }

        this.detectClasses()
        this.sortClasses()
        this.transferMethods()

        // Drop the original interface
        this.idl.entries = this.idl.entries.filter(it => it.name != "es2panda_Impl")
        this.addClassesToFile(this.idl)

        this.postProcess()
        this.dropEs2pandaPrefix()

        console.log(toIDLString(this.idl.entries, {allowUnknownKinds: true}))
    }
}

function killUnneededParameters(parameters: IDLParameter[], index: number): IDLParameter|undefined {
    const parameter = parameters[index]
    // This function return sequence.
    // This is its length.
    if (parameter.name == "returnTypeLen") return undefined

    if (parameter.name == "context" && index == 0) return undefined

    if (index > 0 && parameter.name.endsWith("Len")) {
        const previous = parameters[index-1]
        if (previous.type && isContainerType(previous.type) && previous.type.containerKind == 'sequence') {
            return undefined
        }
    }

    return parameters[index]
}

function detectConstructor(name: string): string|undefined {
    if (name.startsWith("Create")) {
        return name.substring("Create".length)
    }
    return undefined
}

function className(classes: Map<string, IDLInterface>, name: string): string|undefined {
    let found = undefined
    classes.forEach((value, clazz) => {
        if (name.startsWith(clazz)) {
            found = clazz
        }
    })
    return found
}

function methodName(clazzName: string, name: string): string|undefined {
    return name.substring(clazzName.length)
}

function processType(type: IDLType): IDLType {
    if (isReferenceType(type)) {
        if (type.extendedAttributes?.find(it => it.name == "ptr_1")) {
            if (type.name == "char") {
                type.name = "String"
            } else if (!type.name.startsWith("es2panda_")) {
                type.name = `${type.name}Ptr`
            }
            type.extendedAttributes = type.extendedAttributes?.filter(it => it.name != "ptr_1")

            return processType(type)
        }
        if (type.extendedAttributes?.find(it => it.name == "ptr_2")) {
            type.extendedAttributes = type.extendedAttributes?.filter(it => it.name != "ptr_2")

            return processType(createContainerType('sequence', [type]))
        }
        if (type.extendedAttributes?.find(it => it.name == "constant")) {
            type.extendedAttributes = type.extendedAttributes?.filter(it => it.name != "constant")
            //type.name = `${type.name}Const`

            return processType(type)
        }
    }
    return type
}
