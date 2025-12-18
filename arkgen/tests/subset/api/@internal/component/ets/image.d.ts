declare interface ImageInterface { 
    (): ImageAttribute
}

declare class ImageAttribute extends CommonMethod<ImageAttribute> {
}

declare interface PixelMap {
  readonly isEditable: boolean;
  readonly isStrideAlignment: boolean;
  readPixelsToBufferSync(dst: ArrayBuffer): void;
  writeBufferToPixels(src: ArrayBuffer): void;
}

//declare constImage: ImageInterface