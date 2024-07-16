interface BlankInterface {
  (min?: number | string): BlankAttribute;
}

declare class BlankAttribute extends CommonMethod<BlankAttribute> {
  color(value: ResourceColor): BlankAttribute;
}

declare const Blank: BlankInterface;

declare const BlankInstance: BlankAttribute;
