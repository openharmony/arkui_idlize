// Test file for throw Error breaking
function test() {
    if (condition1) {
        if (condition2) {
            if (condition3) {
                // This line is 135 characters with REAL 16-space indent (4 levels * 4 spaces)
                throw new Error( "One of the branches for minFontSizeTmpBuf_BufU has to be chosen through deserialisation. ........." )
            }
        }
    }
}

public static read(buffer: DeserializerBase): MenuOutlineOptions {
        let valueDeserializer : DeserializerBase = buffer
        const widthTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let widthTmpBuf : Dimension | EdgeOutlineWidths | undefined = undefined
        if ((widthTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            const widthTmpBuf_UnionSelector : int32 = valueDeserializer.readInt8()
            let widthTmpBuf_ : Dimension | EdgeOutlineWidths | undefined
            if (widthTmpBuf_UnionSelector == (0).toChar()) {
                const widthTmpBuf_BufUUnionSelector : int32 = valueDeserializer.readInt8()
                let widthTmpBuf_BufU : string | number | Resource | undefined
                if (widthTmpBuf_BufUUnionSelector == (0).toChar()) {
                    widthTmpBuf_BufU = (valueDeserializer.readString() as string)
                } else if (widthTmpBuf_BufUUnionSelector == (1).toChar()) {
                    widthTmpBuf_BufU = (valueDeserializer.readNumber() as number)
                } else if (widthTmpBuf_BufUUnionSelector == (2).toChar()) {
                    widthTmpBuf_BufU = Resource_serializer.read(valueDeserializer)
                } else {
                    throw new Error("One of the branches for widthTmpBuf_BufU has to be chosen through deserialisation.")
                }
                widthTmpBuf_ = (widthTmpBuf_BufU as string | number | Resource)
            } else if (widthTmpBuf_UnionSelector == (1).toChar()) {
                widthTmpBuf_ = EdgeOutlineWidths_serializer.read(valueDeserializer)
            } else {
                throw new Error("One of the branches for widthTmpBuf_ has to be chosen through deserialisation. .......")
            }
            widthTmpBuf = (widthTmpBuf_ as Dimension | EdgeOutlineWidths)
        }
        const widthTmpResult : Dimension | EdgeOutlineWidths | undefined = widthTmpBuf
        const colorTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let colorTmpBuf : ResourceColor | EdgeColors | undefined = undefined
        if ((colorTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            const colorTmpBuf_UnionSelector : int32 = valueDeserializer.readInt8()
            let colorTmpBuf_ : ResourceColor | EdgeColors | undefined
            if (colorTmpBuf_UnionSelector == (0).toChar()) {
                const colorTmpBuf_BufUUnionSelector : int32 = valueDeserializer.readInt8()
                let colorTmpBuf_BufU : Color | int32 | string | Resource | undefined
                if (colorTmpBuf_BufUUnionSelector == (0).toChar()) {
                    colorTmpBuf_BufU = Color.values()[valueDeserializer.readInt32()]
                } else if (colorTmpBuf_BufUUnionSelector == (1).toChar()) {
                    colorTmpBuf_BufU = (valueDeserializer.readInt32())
                } else if (colorTmpBuf_BufUUnionSelector == (2).toChar()) {
                    colorTmpBuf_BufU = (valueDeserializer.readString() as string)
                } else if (colorTmpBuf_BufUUnionSelector == (3).toChar()) {
                    colorTmpBuf_BufU = Resource_serializer.read(valueDeserializer)
                } else {
                    throw new Error("One of the branches for colorTmpBuf_BufU has to be chosen through deserialisation.")
                }
                colorTmpBuf_ = (colorTmpBuf_BufU as Color | int32 | string | Resource)
            } else if (colorTmpBuf_UnionSelector == (1).toChar()) {
                colorTmpBuf_ = EdgeColors_serializer.read(valueDeserializer)
            } else {
                throw new Error("One of the branches for colorTmpBuf_ has to be chosen through deserialisation.")
            }
            colorTmpBuf = (colorTmpBuf_ as ResourceColor | EdgeColors)
        }
        const colorTmpResult : ResourceColor | EdgeColors | undefined = colorTmpBuf
        let value : MenuOutlineOptions = ({width: widthTmpResult, color: colorTmpResult} as MenuOutlineOptions)
        return value
    }

export class LoadingProgressModifier extends CommonMethodModifier implements LoadingProgressAttribute,
    AttributeModifier<LoadingProgressAttribute> {
    _contentModifier_0_0value?: ContentModifier<LoadingProgressConfiguration> | undefined
    enableLoading(value: boolean | undefined): this {
        if (((this._enableLoading_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._enableLoading_0_0value) !== (value)))

        {
            this._enableLoading_0_flag = AttributeUpdaterFlag.UPDATE
            this._enableLoading_0_0value = value
        } else
        {
            this._enableLoading_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }

    contentModifier(value: ContentModifier<LoadingProgressConfiguration> | undefined): this {
        if (((this._contentModifier_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._contentModifier_0_0value) !== (value)))
        {
            this._contentModifier_0_flag = AttributeUpdaterFlag.UPDATE
            this._contentModifier_0_0value = value
        } else
        {
            this._contentModifier_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }

    applyModifierPatch(node: PeerNode): void {
        if (this._onTextSelectionChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onTextSelectionChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnTextSelectionChangeAttribute((this._onTextSelectionChange_0_0value as ((selectionStart: int32,selectionEnd: int32) => void) | undefined));
                    this._onTextSelectionChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onTextSelectionChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onTextSelectionChange_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnTextSelectionChangeAttribute((undefined as ((selectionStart: int32,selectionEnd: int32) => void) | undefined));
                }
            }
        }
    }
    
    applyModifierPatch(node: PeerNode): void {
        if (this._hideTitleBar_1_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._hideTitleBar_1_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setHideTitleBar1Attribute((this._hideTitleBar_1_0value as boolean | undefined), (this._hideTitleBar_1_1value as boolean | undefined));
                    this._hideTitleBar_1_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._hideTitleBar_1_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._hideTitleBar_1_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setHideTitleBar1Attribute((undefined as boolean | undefined), (undefined as boolean | undefined));
                }
            }
        }
    }

    setSelectOptionsAttribute(options: Array<SelectOption>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeInt32((options.length).toInt())
        for (let optionsCounterI = 0; optionsCounterI < options.length; optionsCounterI++) {
            const optionsTmpElement : SelectOption = options[optionsCounterI]
            SelectOption_serializer.write(thisSerializer, optionsTmpElement)
        }
        ArkUIGeneratedNativeModule._SelectInterface_setSelectOptions(this.peer.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }

    public attributeModifier(value: AttributeModifier<SelectAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented. One of the branches for colorTmpBuf_BufU has to be chosen through deserialisation.")
    }


    applyModifierPatch(node: PeerNode): void {
        if (this._bindSelectionMenu_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._bindSelectionMenu_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setBindSelectionMenuAttribute((this._bindSelectionMenu_0_0value as TextSpanType | undefined), (this._bindSelectionMenu_0_1value as CustomBuilder | undefined), (this._bindSelectionMenu_0_2value as TextResponseType | undefined), (this._bindSelectionMenu_0_3value as SelectionMenuOptions | undefined | undefined));
                    this._bindSelectionMenu_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._bindSelectionMenu_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._bindSelectionMenu_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setBindSelectionMenuAttribute((undefined as TextSpanType | undefined), (undefined as CustomBuilder | undefined), (undefined as TextResponseType | undefined), (undefined as SelectionMenuOptions | undefined | undefined));
                }
            }
        }
    }
}
