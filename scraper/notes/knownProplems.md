# Known issues

## IDLs

+ CommonShapeMethod -- remove Component annotation from this declaration and from it's methods

## Generation

+ The generator does not supports `null` type. But it is presents in the SDK.
    + E.g. `api/bundleManager/AbilityInfo`
+ ComponentContent is generic materialized class. It should be made handwritten or handled properly
+ BusinessError is generic and is differ with BusinessError in libohos predefined directory
+ WrapperBuilder is not generated properly.
+ SymbolGlyphModifier and TextModifier is now serializable. Is it correct behavior?
+ CallbackDeserializeCall -- remove generic callback
