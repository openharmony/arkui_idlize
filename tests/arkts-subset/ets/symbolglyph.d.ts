
interface SymbolGlyphInterface {

  (value?: Resource): SymbolGlyphAttribute;
}

declare class SymbolGlyphAttribute extends CommonMethod<SymbolGlyphAttribute> {

  fontSize(value: number | string | Resource): SymbolGlyphAttribute;
}

declare const SymbolGlyph: SymbolGlyphInterface;
