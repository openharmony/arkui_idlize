
interface SymbolGlyphInterface {

  (value?: Resource): SymbolGlyphAttribute;
}

declare class SymbolGlyphAttribute extends CommonMethod<SymbolGlyphAttribute> {

  fontSize(value: number | string | Resource): SymbolGlyphAttribute;
}

//declare constSymbolGlyph: SymbolGlyphInterface;

// declare class SymbolGlyphModifier {
//     constructor(src?: Resource);
// }
